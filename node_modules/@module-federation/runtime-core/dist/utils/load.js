import { error } from "./logger.js";
import { getRemoteEntryExports, globalLoading } from "../global.js";
import { DEFAULT_REMOTE_TYPE, DEFAULT_SCOPE } from "../constant.js";
import { composeKeyWithSeparator, isBrowserEnvValue, loadScript, loadScriptNode } from "@module-federation/sdk";
import { RUNTIME_001, RUNTIME_008, runtimeDescMap } from "@module-federation/error-codes";

//#region src/utils/load.ts
const importCallback = ".then(callbacks[0]).catch(callbacks[1])";
const remoteEntryLoadingOrigins = /* @__PURE__ */ new WeakMap();
const esmRemoteEntryLoadErrorMessages = [
	"Failed to fetch dynamically imported module",
	"Importing a module script failed",
	"error loading dynamically imported module"
];
function isEsmRemoteEntryLoadError(err) {
	if (!(err instanceof TypeError)) return false;
	return esmRemoteEntryLoadErrorMessages.some((loadErrorMessage) => err.message.includes(loadErrorMessage));
}
function isEsmRemoteType(type) {
	return type === "esm" || type === "module";
}
async function loadEsmEntry({ entry, remoteEntryExports, name, getEntryUrl }) {
	return new Promise((resolve, reject) => {
		const rejectEntry = (loadError) => {
			if (isEsmRemoteEntryLoadError(loadError)) {
				const originalMsg = loadError instanceof Error ? loadError.message : String(loadError);
				try {
					error(RUNTIME_008, runtimeDescMap, {
						remoteName: name,
						resourceUrl: url
					}, originalMsg);
				} catch (runtimeError) {
					reject(runtimeError);
					return;
				}
			}
			reject(loadError);
		};
		const url = getEntryUrl ? getEntryUrl(entry) : entry;
		try {
			if (!remoteEntryExports) if (typeof FEDERATION_ALLOW_NEW_FUNCTION !== "undefined") new Function("callbacks", `import("${url}")${importCallback}`)([resolve, rejectEntry]);
			else import(
				/* webpackIgnore: true */
				/* @vite-ignore */
				url
).then(resolve).catch(rejectEntry);
			else resolve(remoteEntryExports);
		} catch (e) {
			error(`Failed to load ESM entry from "${url}". ${e instanceof Error ? e.message : String(e)}`);
		}
	});
}
async function loadSystemJsEntry({ entry, remoteEntryExports }) {
	return new Promise((resolve, reject) => {
		try {
			if (!remoteEntryExports) if (typeof __system_context__ === "undefined") System.import(entry).then(resolve).catch(reject);
			else new Function("callbacks", `System.import("${entry}")${importCallback}`)([resolve, reject]);
			else resolve(remoteEntryExports);
		} catch (e) {
			error(`Failed to load SystemJS entry from "${entry}". ${e instanceof Error ? e.message : String(e)}`);
		}
	});
}
function handleRemoteEntryLoaded(name, globalName, entry) {
	const { remoteEntryKey, entryExports } = getRemoteEntryExports(name, globalName);
	if (!entryExports) error(RUNTIME_001, runtimeDescMap, {
		remoteName: name,
		remoteEntryUrl: entry,
		remoteEntryKey
	});
	return entryExports;
}
async function loadEntryScript({ name, globalName, entry, remoteInfo, loaderHook, getEntryUrl, resourceContext }) {
	const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
	if (remoteEntryExports) return remoteEntryExports;
	const url = getEntryUrl ? getEntryUrl(entry) : entry;
	return loadScript(url, {
		attrs: {},
		createScriptHook: (url, attrs) => {
			const res = loaderHook.lifecycle.createScript.emit({
				url,
				attrs,
				remoteInfo,
				resourceContext: resourceContext ? {
					...resourceContext,
					url
				} : void 0
			});
			if (!res) return;
			if (res instanceof HTMLScriptElement) return res;
			if ("script" in res || "timeout" in res) return res;
		}
	}).then(() => {
		return handleRemoteEntryLoaded(name, globalName, entry);
	}, (loadError) => {
		const originalMsg = loadError instanceof Error ? loadError.message : String(loadError);
		error(RUNTIME_008, runtimeDescMap, {
			remoteName: name,
			resourceUrl: url
		}, originalMsg);
	});
}
async function loadEntryDom({ remoteInfo, remoteEntryExports, loaderHook, getEntryUrl, resourceContext }) {
	const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
	if (isEsmRemoteType(type)) return loadEsmEntry({
		entry,
		remoteEntryExports,
		name,
		getEntryUrl
	});
	if (type === "system") return loadSystemJsEntry({
		entry,
		remoteEntryExports
	});
	return loadEntryScript({
		entry,
		globalName,
		name,
		remoteInfo,
		loaderHook,
		getEntryUrl,
		resourceContext
	});
}
async function loadEntryNode({ remoteInfo, loaderHook, resourceContext }) {
	const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
	const { entryExports: remoteEntryExports } = getRemoteEntryExports(name, globalName);
	if (remoteEntryExports) return remoteEntryExports;
	return loadScriptNode(entry, {
		attrs: {
			name,
			globalName,
			type
		},
		loaderHook: { createScriptHook: (url, attrs = {}) => {
			const res = loaderHook.lifecycle.createScript.emit({
				url,
				attrs,
				remoteInfo,
				resourceContext: resourceContext ? {
					...resourceContext,
					url
				} : void 0
			});
			if (!res) return;
			if ("url" in res) return res;
		} }
	}).then(() => {
		return handleRemoteEntryLoaded(name, globalName, entry);
	}).catch((e) => {
		error(`Failed to load Node.js entry for remote "${name}" from "${entry}". ${e instanceof Error ? e.message : String(e)}`);
	});
}
function getRemoteEntryUniqueKey(remoteInfo) {
	const { entry, name } = remoteInfo;
	return composeKeyWithSeparator(name, entry);
}
async function getRemoteEntry(params) {
	const { origin, remoteEntryExports, remoteInfo, getEntryUrl, resourceContext, _inErrorHandling = false } = params;
	const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
	if (remoteEntryExports) {
		await origin.loaderHook.lifecycle.afterLoadEntry.emit({
			origin,
			remoteInfo,
			remoteEntryExports,
			resourceContext,
			cached: true
		});
		return remoteEntryExports;
	}
	if (!globalLoading[uniqueKey]) {
		const loadEntryHook = origin.remoteHandler.hooks.lifecycle.loadEntry;
		const loaderHook = origin.loaderHook;
		globalLoading[uniqueKey] = loadEntryHook.emit({
			origin,
			loaderHook,
			remoteInfo,
			remoteEntryExports,
			resourceContext
		}).then((res) => {
			if (res) return res;
			return (typeof ENV_TARGET !== "undefined" ? ENV_TARGET === "web" : isBrowserEnvValue) ? loadEntryDom({
				remoteInfo,
				remoteEntryExports,
				loaderHook,
				getEntryUrl,
				resourceContext
			}) : loadEntryNode({
				remoteInfo,
				loaderHook,
				resourceContext
			});
		}).then(async (res) => {
			await origin.loaderHook.lifecycle.afterLoadEntry.emit({
				origin,
				remoteInfo,
				remoteEntryExports: res,
				resourceContext
			});
			return res;
		}).catch(async (loadError) => {
			const isScriptExecutionError = loadError instanceof Error && loadError.message.includes("ScriptExecutionError");
			if (loadError instanceof Error && loadError.message.includes(RUNTIME_008) && !isScriptExecutionError && !_inErrorHandling) {
				const wrappedGetRemoteEntry = (params) => {
					return getRemoteEntry({
						...params,
						_inErrorHandling: true
					});
				};
				const recoveredRemoteEntryExports = await origin.loaderHook.lifecycle.loadEntryError.emit({
					getRemoteEntry: wrappedGetRemoteEntry,
					origin,
					remoteInfo,
					remoteEntryExports,
					globalLoading,
					uniqueKey
				});
				if (recoveredRemoteEntryExports) {
					await origin.loaderHook.lifecycle.afterLoadEntry.emit({
						origin,
						remoteInfo,
						remoteEntryExports: recoveredRemoteEntryExports,
						resourceContext,
						error: loadError,
						recovered: true
					});
					return recoveredRemoteEntryExports;
				}
			}
			await origin.loaderHook.lifecycle.afterLoadEntry.emit({
				origin,
				remoteInfo,
				resourceContext,
				error: loadError
			});
			throw loadError;
		});
		remoteEntryLoadingOrigins.set(globalLoading[uniqueKey], origin);
	}
	const remoteEntryLoading = globalLoading[uniqueKey];
	if (remoteEntryLoadingOrigins.get(remoteEntryLoading) !== origin) try {
		const result = await remoteEntryLoading;
		await origin.loaderHook.lifecycle.afterLoadEntry.emit({
			origin,
			remoteInfo,
			remoteEntryExports: result,
			resourceContext
		});
		return result;
	} catch (loadError) {
		await origin.loaderHook.lifecycle.afterLoadEntry.emit({
			origin,
			remoteInfo,
			resourceContext,
			error: loadError
		});
		throw loadError;
	}
	return remoteEntryLoading;
}
function getRemoteInfo(remote) {
	return {
		...remote,
		entry: "entry" in remote ? remote.entry : "",
		type: remote.type || DEFAULT_REMOTE_TYPE,
		entryGlobalName: remote.entryGlobalName || remote.name,
		shareScope: remote.shareScope || DEFAULT_SCOPE
	};
}

//#endregion
export { getRemoteEntry, getRemoteEntryUniqueKey, getRemoteInfo, isEsmRemoteType };
//# sourceMappingURL=load.js.map
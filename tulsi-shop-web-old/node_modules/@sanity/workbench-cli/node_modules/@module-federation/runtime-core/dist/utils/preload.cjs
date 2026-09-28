const require_logger = require('./logger.cjs');
const require_global = require('../global.cjs');
const require_manifest = require('./manifest.cjs');
const require_load = require('./load.cjs');
let _module_federation_sdk = require("@module-federation/sdk");

//#region src/utils/preload.ts
function defaultPreloadArgs(preloadConfig) {
	return {
		resourceCategory: "sync",
		share: true,
		depsRemote: true,
		recordPreloadedAssets: true,
		...preloadConfig
	};
}
function formatPreloadArgs(remotes, preloadArgs) {
	return preloadArgs.map((args) => {
		const remoteInfo = require_manifest.matchRemote(remotes, args.nameOrAlias);
		require_logger.assert(remoteInfo, `Unable to preload ${args.nameOrAlias} as it is not included in ${!remoteInfo && (0, _module_federation_sdk.safeToString)({
			remoteInfo,
			remotes
		})}`);
		return {
			remote: remoteInfo,
			preloadConfig: defaultPreloadArgs(args)
		};
	});
}
function normalizePreloadExposes(exposes) {
	if (!exposes) return [];
	return exposes.map((expose) => {
		if (expose === ".") return expose;
		if (expose.startsWith("./")) return expose.replace("./", "");
		return expose;
	});
}
function isTimeoutError(error) {
	if (!(error instanceof Error)) return false;
	return error.message.includes("timed out") || error.name.includes("Timeout");
}
function createAssetResult(context, url, status, error) {
	return {
		url,
		status,
		resourceType: context.resourceType,
		initiator: context.initiator,
		id: context.id,
		error
	};
}
function preloadAssetOnce(context, url, recordPreloadedAssets, preload) {
	if (!recordPreloadedAssets) return preload();
	if (require_global.getPreloadedAsset(url)) return Promise.resolve(createAssetResult(context, url, "cached"));
	require_global.setPreloadedAsset(url);
	return preload();
}
async function waitForRemoteEntryPreload(host, remoteInfo, entryRemoteInfo, context) {
	const cachedRemote = host.moduleCache.get(entryRemoteInfo.name);
	const url = entryRemoteInfo.entry;
	if (cachedRemote?.remoteEntryExports) return createAssetResult(context, url, "cached");
	try {
		if (!await require_load.getRemoteEntry({
			origin: host,
			remoteInfo: entryRemoteInfo,
			remoteEntryExports: cachedRemote?.remoteEntryExports,
			resourceContext: {
				...context,
				url
			}
		})) throw new Error(`Failed to load remoteEntry "${url}".`);
		return createAssetResult(context, url, "success");
	} catch (error) {
		return createAssetResult(context, url, isTimeoutError(error) ? "timeout" : "error", error);
	}
}
function waitForLinkPreload({ host, remoteInfo, url, attrs, context, needDeleteLink }) {
	return new Promise((resolve) => {
		const { link, needAttach } = (0, _module_federation_sdk.createLink)({
			url,
			cb: () => {
				resolve(createAssetResult(context, url, needAttach ? "success" : "cached"));
			},
			onErrorCallback: (error) => {
				resolve(createAssetResult(context, url, isTimeoutError(error) ? "timeout" : "error", error));
			},
			attrs,
			createLinkHook: (hookUrl, hookAttrs) => {
				const res = host.loaderHook.lifecycle.createLink.emit({
					url: hookUrl,
					attrs: hookAttrs,
					remoteInfo,
					resourceContext: {
						...context,
						url: hookUrl
					}
				});
				if (res instanceof HTMLLinkElement) return res;
				return res;
			},
			needDeleteLink
		});
		needAttach && document.head.appendChild(link);
	});
}
function waitForScriptPreload({ host, remoteInfo, url, attrs, context }) {
	return new Promise((resolve) => {
		const { script, needAttach } = (0, _module_federation_sdk.createScript)({
			url,
			cb: () => {
				resolve(createAssetResult(context, url, needAttach ? "success" : "cached"));
			},
			onErrorCallback: (error) => {
				resolve(createAssetResult(context, url, isTimeoutError(error) ? "timeout" : "error", error));
			},
			attrs,
			createScriptHook: (hookUrl, hookAttrs) => {
				const res = host.loaderHook.lifecycle.createScript.emit({
					url: hookUrl,
					attrs: hookAttrs,
					remoteInfo,
					resourceContext: {
						...context,
						url: hookUrl
					}
				});
				if (res instanceof HTMLScriptElement) return res;
				return res;
			},
			needDeleteScript: true
		});
		needAttach && document.head.appendChild(script);
	});
}
function createResourceContext(baseContext, resourceType) {
	return {
		...baseContext,
		resourceType
	};
}
function preloadAssets(remoteInfo, host, assets, useLinkPreload = true, baseContext = {
	initiator: "preloadRemote",
	id: remoteInfo.name
}, recordPreloadedAssets = true) {
	const { cssAssets, jsAssetsWithoutEntry, entryAssets } = assets;
	const results = [];
	if (host.options.inBrowser) {
		entryAssets.forEach((asset) => {
			const { moduleInfo: entryRemoteInfo } = asset;
			results.push(waitForRemoteEntryPreload(host, remoteInfo, entryRemoteInfo, createResourceContext(baseContext, "remoteEntry")));
		});
		if (useLinkPreload) {
			const defaultAttrs = {
				rel: "preload",
				as: "style"
			};
			cssAssets.forEach((cssUrl) => {
				const context = createResourceContext(baseContext, "css");
				results.push(preloadAssetOnce(context, cssUrl, recordPreloadedAssets, () => waitForLinkPreload({
					host,
					remoteInfo,
					url: cssUrl,
					attrs: defaultAttrs,
					context
				})));
			});
		} else {
			const defaultAttrs = {
				rel: "stylesheet",
				type: "text/css"
			};
			cssAssets.forEach((cssUrl) => {
				const context = createResourceContext(baseContext, "css");
				results.push(preloadAssetOnce(context, cssUrl, recordPreloadedAssets, () => waitForLinkPreload({
					host,
					remoteInfo,
					url: cssUrl,
					attrs: defaultAttrs,
					needDeleteLink: false,
					context
				})));
			});
		}
		let preloadJsAsset = waitForScriptPreload;
		let defaultAttrs = {
			fetchpriority: "high",
			type: "text/javascript"
		};
		if (useLinkPreload) {
			preloadJsAsset = waitForLinkPreload;
			defaultAttrs = {
				rel: "preload",
				as: "script"
			};
		} else if (require_load.isEsmRemoteType(remoteInfo.type)) {
			preloadJsAsset = waitForLinkPreload;
			defaultAttrs = {
				rel: "modulepreload",
				fetchpriority: "high"
			};
		}
		jsAssetsWithoutEntry.forEach((jsUrl) => {
			const context = createResourceContext(baseContext, "js");
			results.push(preloadAssetOnce(context, jsUrl, recordPreloadedAssets, () => preloadJsAsset({
				host,
				remoteInfo,
				url: jsUrl,
				attrs: defaultAttrs,
				context
			})));
		});
	}
	return Promise.all(results);
}

//#endregion
exports.defaultPreloadArgs = defaultPreloadArgs;
exports.formatPreloadArgs = formatPreloadArgs;
exports.normalizePreloadExposes = normalizePreloadExposes;
exports.preloadAssets = preloadAssets;
//# sourceMappingURL=preload.cjs.map
import { error } from "../../utils/logger.js";
import { isRemoteInfoWithEntry } from "../../utils/tool.js";
import { Global, addGlobalSnapshot, getGlobalSnapshot, getGlobalSnapshotInfoByModuleInfo, getInfoWithoutType, setGlobalSnapshotInfoByModuleInfo } from "../../global.js";
import { getRemoteInfo } from "../../utils/load.js";
import { optionsToMFContext } from "../../utils/context.js";
import "../../utils/index.js";
import { AsyncHook } from "../../utils/hooks/asyncHook.js";
import { AsyncWaterfallHook } from "../../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../../utils/hooks/pluginSystem.js";
import "../../utils/hooks/index.js";
import { generateSnapshotFromManifest, isBrowserEnvValue, isManifestProvider } from "@module-federation/sdk";
import { RUNTIME_003, RUNTIME_007, RUNTIME_013, runtimeDescMap } from "@module-federation/error-codes";

//#region src/plugins/snapshot/SnapshotHandler.ts
function getGlobalRemoteInfo(moduleInfo, origin) {
	const hostGlobalSnapshot = getGlobalSnapshotInfoByModuleInfo({
		name: origin.name,
		version: origin.options.version
	});
	const globalRemoteInfo = hostGlobalSnapshot && "remotesInfo" in hostGlobalSnapshot && hostGlobalSnapshot.remotesInfo && getInfoWithoutType(hostGlobalSnapshot.remotesInfo, moduleInfo.name).value;
	if (globalRemoteInfo && globalRemoteInfo.matchedVersion) return {
		hostGlobalSnapshot,
		globalSnapshot: getGlobalSnapshot(),
		remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
			name: moduleInfo.name,
			version: globalRemoteInfo.matchedVersion
		})
	};
	return {
		hostGlobalSnapshot: void 0,
		globalSnapshot: getGlobalSnapshot(),
		remoteSnapshot: getGlobalSnapshotInfoByModuleInfo({
			name: moduleInfo.name,
			version: "version" in moduleInfo ? moduleInfo.version : void 0
		})
	};
}
var SnapshotHandler = class {
	constructor(HostInstance) {
		this.loadingHostSnapshot = null;
		this.manifestCache = /* @__PURE__ */ new Map();
		this.hooks = new PluginSystem({
			beforeLoadRemoteSnapshot: new AsyncHook("beforeLoadRemoteSnapshot"),
			loadSnapshot: new AsyncWaterfallHook("loadGlobalSnapshot"),
			loadRemoteSnapshot: new AsyncWaterfallHook("loadRemoteSnapshot"),
			afterLoadSnapshot: new AsyncWaterfallHook("afterLoadSnapshot"),
			beforeLoadManifest: new AsyncHook("beforeLoadManifest"),
			afterLoadManifest: new AsyncHook("afterLoadManifest")
		});
		this.manifestLoading = Global.__FEDERATION__.__MANIFEST_LOADING__;
		this.HostInstance = HostInstance;
		this.loaderHook = HostInstance.loaderHook;
	}
	async loadRemoteSnapshotInfo({ moduleInfo, id, initiator = "loadRemote" }) {
		const { options } = this.HostInstance;
		await this.hooks.lifecycle.beforeLoadRemoteSnapshot.emit({
			options,
			moduleInfo,
			origin: this.HostInstance
		});
		let hostSnapshot = getGlobalSnapshotInfoByModuleInfo({
			name: this.HostInstance.options.name,
			version: this.HostInstance.options.version
		});
		if (!hostSnapshot) {
			hostSnapshot = {
				version: this.HostInstance.options.version || "",
				remoteEntry: "",
				remotesInfo: {}
			};
			addGlobalSnapshot({ [this.HostInstance.options.name]: hostSnapshot });
		}
		if (hostSnapshot && "remotesInfo" in hostSnapshot && !getInfoWithoutType(hostSnapshot.remotesInfo, moduleInfo.name).value) {
			if ("version" in moduleInfo || "entry" in moduleInfo) hostSnapshot.remotesInfo = {
				...hostSnapshot?.remotesInfo,
				[moduleInfo.name]: { matchedVersion: "version" in moduleInfo ? moduleInfo.version : moduleInfo.entry }
			};
		}
		const { hostGlobalSnapshot, remoteSnapshot, globalSnapshot } = this.getGlobalRemoteInfo(moduleInfo);
		const { remoteSnapshot: globalRemoteSnapshot, globalSnapshot: globalSnapshotRes } = await this.hooks.lifecycle.loadSnapshot.emit({
			options,
			moduleInfo,
			hostGlobalSnapshot,
			remoteSnapshot,
			globalSnapshot
		});
		let mSnapshot;
		let gSnapshot;
		if (globalRemoteSnapshot) if (isManifestProvider(globalRemoteSnapshot)) {
			const remoteEntry = isBrowserEnvValue ? globalRemoteSnapshot.remoteEntry : globalRemoteSnapshot.ssrRemoteEntry || globalRemoteSnapshot.remoteEntry || "";
			const moduleSnapshot = await this.loadManifestSnapshot(remoteEntry, moduleInfo, {}, {
				initiator,
				id: id || moduleInfo.name
			});
			const globalSnapshotRes = setGlobalSnapshotInfoByModuleInfo({
				...moduleInfo,
				entry: remoteEntry
			}, moduleSnapshot);
			mSnapshot = moduleSnapshot;
			gSnapshot = globalSnapshotRes;
		} else {
			const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
				options: this.HostInstance.options,
				moduleInfo,
				remoteSnapshot: globalRemoteSnapshot,
				from: "global"
			});
			mSnapshot = remoteSnapshotRes;
			gSnapshot = globalSnapshotRes;
		}
		else if (isRemoteInfoWithEntry(moduleInfo)) {
			const moduleSnapshot = await this.loadManifestSnapshot(moduleInfo.entry, moduleInfo, {}, {
				initiator,
				id: id || moduleInfo.name
			});
			const globalSnapshotRes = setGlobalSnapshotInfoByModuleInfo(moduleInfo, moduleSnapshot);
			mSnapshot = moduleSnapshot;
			gSnapshot = globalSnapshotRes;
		} else error(RUNTIME_007, runtimeDescMap, {
			remoteName: moduleInfo.name,
			remoteVersion: moduleInfo.version,
			hostName: this.HostInstance.options.name,
			globalSnapshot: JSON.stringify(globalSnapshotRes)
		}, void 0, optionsToMFContext(this.HostInstance.options));
		await this.hooks.lifecycle.afterLoadSnapshot.emit({
			id,
			host: this.HostInstance,
			options,
			moduleInfo,
			remoteSnapshot: mSnapshot
		});
		return {
			remoteSnapshot: mSnapshot,
			globalSnapshot: gSnapshot
		};
	}
	getGlobalRemoteInfo(moduleInfo) {
		return getGlobalRemoteInfo(moduleInfo, this.HostInstance);
	}
	async getManifestJson(manifestUrl, moduleInfo, extraOptions, resourceOptions) {
		const getManifest = async () => {
			const remoteInfo = getRemoteInfo(moduleInfo);
			let manifestJson = this.manifestCache.get(manifestUrl);
			if (manifestJson) {
				await this.hooks.lifecycle.afterLoadManifest.emit({
					manifestUrl,
					moduleInfo,
					resourceOptions,
					manifestJson,
					cached: true,
					origin: this.HostInstance
				});
				return manifestJson;
			}
			await this.hooks.lifecycle.beforeLoadManifest.emit({
				manifestUrl,
				moduleInfo,
				resourceOptions,
				origin: this.HostInstance
			});
			let response;
			let loadError;
			let recovered = false;
			try {
				let res = await this.loaderHook.lifecycle.fetch.emit(manifestUrl, {}, remoteInfo, resourceOptions ? {
					...resourceOptions,
					url: manifestUrl,
					resourceType: "manifest"
				} : void 0);
				if (!res || !(res instanceof Response)) res = await fetch(manifestUrl, {});
				response = res;
				manifestJson = await res.json();
			} catch (err) {
				loadError = err;
				manifestJson = await this.HostInstance.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
					id: manifestUrl,
					error: err,
					from: "runtime",
					lifecycle: "afterResolve",
					remote: remoteInfo,
					origin: this.HostInstance
				});
				if (!manifestJson) {
					delete this.manifestLoading[manifestUrl];
					await this.hooks.lifecycle.afterLoadManifest.emit({
						manifestUrl,
						moduleInfo,
						resourceOptions,
						response,
						error: err,
						origin: this.HostInstance
					});
					error(RUNTIME_003, runtimeDescMap, {
						manifestUrl,
						moduleName: moduleInfo.name,
						hostName: this.HostInstance.options.name
					}, `${err}`, optionsToMFContext(this.HostInstance.options));
				}
				recovered = true;
			}
			const missingRequiredFields = [
				!manifestJson.metaData && "metaData",
				!manifestJson.exposes && "exposes",
				!manifestJson.shared && "shared"
			].filter(Boolean);
			const validationError = missingRequiredFields.length > 0 ? /* @__PURE__ */ new Error(`"${manifestUrl}" is not a valid federation manifest for remote "${moduleInfo.name}". Missing required fields: ${missingRequiredFields.join(", ")}.`) : void 0;
			if (validationError) await this.HostInstance.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
				id: manifestUrl,
				error: validationError,
				from: "runtime",
				lifecycle: "afterResolve",
				remote: remoteInfo,
				origin: this.HostInstance
			});
			await this.hooks.lifecycle.afterLoadManifest.emit({
				manifestUrl,
				moduleInfo,
				resourceOptions,
				manifestJson,
				response,
				error: validationError || loadError,
				recovered: validationError ? void 0 : recovered || void 0,
				origin: this.HostInstance
			});
			if (validationError) error(RUNTIME_013, runtimeDescMap, {
				manifestUrl,
				moduleName: moduleInfo.name,
				hostName: this.HostInstance.options.name,
				missingFields: missingRequiredFields.join(",")
			}, void 0, optionsToMFContext(this.HostInstance.options));
			this.manifestCache.set(manifestUrl, manifestJson);
			return manifestJson;
		};
		return getManifest();
	}
	async loadManifestSnapshot(manifestUrl, moduleInfo, extraOptions, resourceOptions) {
		const asyncLoadProcess = async () => {
			const manifestJson = await this.getManifestJson(manifestUrl, moduleInfo, extraOptions, resourceOptions);
			const remoteSnapshot = generateSnapshotFromManifest(manifestJson, { version: manifestUrl });
			const { remoteSnapshot: remoteSnapshotRes } = await this.hooks.lifecycle.loadRemoteSnapshot.emit({
				options: this.HostInstance.options,
				moduleInfo,
				manifestJson,
				remoteSnapshot,
				manifestUrl,
				from: "manifest"
			});
			return remoteSnapshotRes;
		};
		if (!this.manifestLoading[manifestUrl]) this.manifestLoading[manifestUrl] = asyncLoadProcess().then((res) => res);
		return this.manifestLoading[manifestUrl];
	}
};

//#endregion
export { SnapshotHandler, getGlobalRemoteInfo };
//# sourceMappingURL=SnapshotHandler.js.map
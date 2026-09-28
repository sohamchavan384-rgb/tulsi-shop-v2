const require_logger = require('../../utils/logger.cjs');
const require_tool = require('../../utils/tool.cjs');
const require_global = require('../../global.cjs');
const require_load = require('../../utils/load.cjs');
const require_context = require('../../utils/context.cjs');
require('../../utils/index.cjs');
const require_asyncHook = require('../../utils/hooks/asyncHook.cjs');
const require_asyncWaterfallHooks = require('../../utils/hooks/asyncWaterfallHooks.cjs');
const require_pluginSystem = require('../../utils/hooks/pluginSystem.cjs');
require('../../utils/hooks/index.cjs');
let _module_federation_sdk = require("@module-federation/sdk");
let _module_federation_error_codes = require("@module-federation/error-codes");

//#region src/plugins/snapshot/SnapshotHandler.ts
function getGlobalRemoteInfo(moduleInfo, origin) {
	const hostGlobalSnapshot = require_global.getGlobalSnapshotInfoByModuleInfo({
		name: origin.name,
		version: origin.options.version
	});
	const globalRemoteInfo = hostGlobalSnapshot && "remotesInfo" in hostGlobalSnapshot && hostGlobalSnapshot.remotesInfo && require_global.getInfoWithoutType(hostGlobalSnapshot.remotesInfo, moduleInfo.name).value;
	if (globalRemoteInfo && globalRemoteInfo.matchedVersion) return {
		hostGlobalSnapshot,
		globalSnapshot: require_global.getGlobalSnapshot(),
		remoteSnapshot: require_global.getGlobalSnapshotInfoByModuleInfo({
			name: moduleInfo.name,
			version: globalRemoteInfo.matchedVersion
		})
	};
	return {
		hostGlobalSnapshot: void 0,
		globalSnapshot: require_global.getGlobalSnapshot(),
		remoteSnapshot: require_global.getGlobalSnapshotInfoByModuleInfo({
			name: moduleInfo.name,
			version: "version" in moduleInfo ? moduleInfo.version : void 0
		})
	};
}
var SnapshotHandler = class {
	constructor(HostInstance) {
		this.loadingHostSnapshot = null;
		this.manifestCache = /* @__PURE__ */ new Map();
		this.hooks = new require_pluginSystem.PluginSystem({
			beforeLoadRemoteSnapshot: new require_asyncHook.AsyncHook("beforeLoadRemoteSnapshot"),
			loadSnapshot: new require_asyncWaterfallHooks.AsyncWaterfallHook("loadGlobalSnapshot"),
			loadRemoteSnapshot: new require_asyncWaterfallHooks.AsyncWaterfallHook("loadRemoteSnapshot"),
			afterLoadSnapshot: new require_asyncWaterfallHooks.AsyncWaterfallHook("afterLoadSnapshot"),
			beforeLoadManifest: new require_asyncHook.AsyncHook("beforeLoadManifest"),
			afterLoadManifest: new require_asyncHook.AsyncHook("afterLoadManifest")
		});
		this.manifestLoading = require_global.Global.__FEDERATION__.__MANIFEST_LOADING__;
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
		let hostSnapshot = require_global.getGlobalSnapshotInfoByModuleInfo({
			name: this.HostInstance.options.name,
			version: this.HostInstance.options.version
		});
		if (!hostSnapshot) {
			hostSnapshot = {
				version: this.HostInstance.options.version || "",
				remoteEntry: "",
				remotesInfo: {}
			};
			require_global.addGlobalSnapshot({ [this.HostInstance.options.name]: hostSnapshot });
		}
		if (hostSnapshot && "remotesInfo" in hostSnapshot && !require_global.getInfoWithoutType(hostSnapshot.remotesInfo, moduleInfo.name).value) {
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
		if (globalRemoteSnapshot) if ((0, _module_federation_sdk.isManifestProvider)(globalRemoteSnapshot)) {
			const remoteEntry = _module_federation_sdk.isBrowserEnvValue ? globalRemoteSnapshot.remoteEntry : globalRemoteSnapshot.ssrRemoteEntry || globalRemoteSnapshot.remoteEntry || "";
			const moduleSnapshot = await this.loadManifestSnapshot(remoteEntry, moduleInfo, {}, {
				initiator,
				id: id || moduleInfo.name
			});
			const globalSnapshotRes = require_global.setGlobalSnapshotInfoByModuleInfo({
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
		else if (require_tool.isRemoteInfoWithEntry(moduleInfo)) {
			const moduleSnapshot = await this.loadManifestSnapshot(moduleInfo.entry, moduleInfo, {}, {
				initiator,
				id: id || moduleInfo.name
			});
			const globalSnapshotRes = require_global.setGlobalSnapshotInfoByModuleInfo(moduleInfo, moduleSnapshot);
			mSnapshot = moduleSnapshot;
			gSnapshot = globalSnapshotRes;
		} else require_logger.error(_module_federation_error_codes.RUNTIME_007, _module_federation_error_codes.runtimeDescMap, {
			remoteName: moduleInfo.name,
			remoteVersion: moduleInfo.version,
			hostName: this.HostInstance.options.name,
			globalSnapshot: JSON.stringify(globalSnapshotRes)
		}, void 0, require_context.optionsToMFContext(this.HostInstance.options));
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
			const remoteInfo = require_load.getRemoteInfo(moduleInfo);
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
					require_logger.error(_module_federation_error_codes.RUNTIME_003, _module_federation_error_codes.runtimeDescMap, {
						manifestUrl,
						moduleName: moduleInfo.name,
						hostName: this.HostInstance.options.name
					}, `${err}`, require_context.optionsToMFContext(this.HostInstance.options));
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
			if (validationError) require_logger.error(_module_federation_error_codes.RUNTIME_013, _module_federation_error_codes.runtimeDescMap, {
				manifestUrl,
				moduleName: moduleInfo.name,
				hostName: this.HostInstance.options.name,
				missingFields: missingRequiredFields.join(",")
			}, void 0, require_context.optionsToMFContext(this.HostInstance.options));
			this.manifestCache.set(manifestUrl, manifestJson);
			return manifestJson;
		};
		return getManifest();
	}
	async loadManifestSnapshot(manifestUrl, moduleInfo, extraOptions, resourceOptions) {
		const asyncLoadProcess = async () => {
			const manifestJson = await this.getManifestJson(manifestUrl, moduleInfo, extraOptions, resourceOptions);
			const remoteSnapshot = (0, _module_federation_sdk.generateSnapshotFromManifest)(manifestJson, { version: manifestUrl });
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
exports.SnapshotHandler = SnapshotHandler;
exports.getGlobalRemoteInfo = getGlobalRemoteInfo;
//# sourceMappingURL=SnapshotHandler.cjs.map
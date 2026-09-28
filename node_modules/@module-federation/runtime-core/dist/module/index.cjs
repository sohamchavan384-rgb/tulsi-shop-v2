const require_logger = require('../utils/logger.cjs');
const require_tool = require('../utils/tool.cjs');
const require_manifest = require('../utils/manifest.cjs');
const require_load = require('../utils/load.cjs');
const require_context = require('../utils/context.cjs');
require('../utils/index.cjs');
let _module_federation_sdk = require("@module-federation/sdk");
let _module_federation_error_codes = require("@module-federation/error-codes");

//#region src/module/index.ts
function getAvailableExposeNames(remoteSnapshot) {
	if (!remoteSnapshot || !("modules" in remoteSnapshot) || !Array.isArray(remoteSnapshot.modules)) return;
	const exposes = remoteSnapshot.modules.map((module) => module.moduleName).filter(Boolean);
	return exposes.length ? exposes.join(",") : void 0;
}
function createRemoteEntryInitOptions(remoteInfo, hostShareScopeMap, rawInitScope) {
	const localShareScopeMap = hostShareScopeMap;
	const shareScopeKeys = Array.isArray(remoteInfo.shareScope) ? remoteInfo.shareScope : [remoteInfo.shareScope];
	if (!shareScopeKeys.length) shareScopeKeys.push("default");
	shareScopeKeys.forEach((shareScopeKey) => {
		if (!localShareScopeMap[shareScopeKey]) localShareScopeMap[shareScopeKey] = {};
	});
	const remoteEntryInitOptions = {
		version: remoteInfo.version || "",
		shareScopeKeys: Array.isArray(remoteInfo.shareScope) ? shareScopeKeys : remoteInfo.shareScope || "default"
	};
	Object.defineProperty(remoteEntryInitOptions, "shareScopeMap", {
		value: localShareScopeMap,
		enumerable: false
	});
	return {
		remoteEntryInitOptions,
		shareScope: localShareScopeMap[shareScopeKeys[0]],
		initScope: rawInitScope ?? []
	};
}
var Module = class {
	constructor({ remoteInfo, host }) {
		this.inited = false;
		this.initing = false;
		this.lib = void 0;
		this.remoteInfo = remoteInfo;
		this.host = host;
	}
	async getEntry(expose, resourceContext) {
		const effectiveResourceContext = resourceContext || {
			initiator: "loadRemote",
			id: require_manifest.composeRemoteRequestId(this.remoteInfo.name, expose),
			resourceType: "remoteEntry",
			url: this.remoteInfo.entry,
			expose
		};
		const remoteEntryExports = await require_load.getRemoteEntry({
			origin: this.host,
			remoteInfo: this.remoteInfo,
			remoteEntryExports: this.remoteEntryExports,
			resourceContext: effectiveResourceContext
		});
		require_logger.assert(remoteEntryExports, `remoteEntryExports is undefined \n ${(0, _module_federation_sdk.safeToString)(this.remoteInfo)}`);
		this.remoteEntryExports = remoteEntryExports;
		return this.remoteEntryExports;
	}
	async init(id, remoteSnapshot, rawInitScope, expose, resourceContext) {
		const remoteEntryExports = await this.getEntry(expose, resourceContext);
		if (this.inited) {
			await this.host.loaderHook.lifecycle.afterInitRemote.emit({
				id,
				remoteInfo: this.remoteInfo,
				remoteSnapshot,
				remoteEntryExports,
				cached: true,
				origin: this.host
			});
			return remoteEntryExports;
		}
		if (this.initPromise) {
			try {
				await this.initPromise;
				await this.host.loaderHook.lifecycle.afterInitRemote.emit({
					id,
					remoteInfo: this.remoteInfo,
					remoteSnapshot,
					remoteEntryExports,
					cached: true,
					origin: this.host
				});
			} catch (initError) {
				await this.host.loaderHook.lifecycle.afterInitRemote.emit({
					id,
					remoteInfo: this.remoteInfo,
					remoteSnapshot,
					remoteEntryExports,
					error: initError,
					cached: true,
					origin: this.host
				});
				throw initError;
			}
			return remoteEntryExports;
		}
		this.initing = true;
		this.initPromise = (async () => {
			await this.host.loaderHook.lifecycle.beforeInitRemote.emit({
				id,
				remoteInfo: this.remoteInfo,
				remoteSnapshot,
				origin: this.host
			});
			const { remoteEntryInitOptions, shareScope, initScope } = createRemoteEntryInitOptions(this.remoteInfo, this.host.shareScopeMap, rawInitScope);
			const initContainerOptions = await this.host.hooks.lifecycle.beforeInitContainer.emit({
				shareScope,
				remoteEntryInitOptions,
				initScope,
				remoteInfo: this.remoteInfo,
				origin: this.host
			});
			if (typeof remoteEntryExports?.init === "undefined") require_logger.error(_module_federation_error_codes.RUNTIME_002, _module_federation_error_codes.runtimeDescMap, {
				hostName: this.host.name,
				remoteName: this.remoteInfo.name,
				remoteEntryUrl: this.remoteInfo.entry,
				remoteEntryKey: this.remoteInfo.entryGlobalName
			}, void 0, require_context.optionsToMFContext(this.host.options));
			try {
				await remoteEntryExports.init(initContainerOptions.shareScope, initContainerOptions.initScope, initContainerOptions.remoteEntryInitOptions);
			} catch (initError) {
				require_logger.error(_module_federation_error_codes.RUNTIME_015, _module_federation_error_codes.runtimeDescMap, {
					hostName: this.host.name,
					remoteName: this.remoteInfo.name,
					remoteEntryUrl: this.remoteInfo.entry,
					remoteEntryKey: this.remoteInfo.entryGlobalName,
					shareScope: this.remoteInfo.shareScope
				}, `${initError}`, require_context.optionsToMFContext(this.host.options));
			}
			await this.host.hooks.lifecycle.initContainer.emit({
				...initContainerOptions,
				id,
				remoteSnapshot,
				remoteEntryExports
			});
			this.inited = true;
		})();
		try {
			await this.initPromise;
			await this.host.loaderHook.lifecycle.afterInitRemote.emit({
				id,
				remoteInfo: this.remoteInfo,
				remoteSnapshot,
				remoteEntryExports,
				origin: this.host
			});
		} catch (initError) {
			await this.host.loaderHook.lifecycle.afterInitRemote.emit({
				id,
				remoteInfo: this.remoteInfo,
				remoteSnapshot,
				remoteEntryExports,
				error: initError,
				origin: this.host
			});
			throw initError;
		} finally {
			this.initing = false;
			this.initPromise = void 0;
		}
		return remoteEntryExports;
	}
	async get(id, expose, options, remoteSnapshot) {
		const { loadFactory = true } = options || { loadFactory: true };
		const remoteEntryExports = await this.init(id, remoteSnapshot, void 0, expose);
		this.lib = remoteEntryExports;
		await this.host.loaderHook.lifecycle.beforeGetExpose.emit({
			id,
			expose,
			moduleInfo: this.remoteInfo,
			remoteEntryExports,
			origin: this.host
		});
		let moduleFactory;
		try {
			const hookModuleFactory = await this.host.loaderHook.lifecycle.getModuleFactory.emit({
				remoteEntryExports,
				expose,
				moduleInfo: this.remoteInfo
			});
			moduleFactory = typeof hookModuleFactory === "function" ? hookModuleFactory : void 0;
			if (!moduleFactory) moduleFactory = await remoteEntryExports.get(expose);
			if (!moduleFactory) require_logger.error(_module_federation_error_codes.RUNTIME_014, _module_federation_error_codes.runtimeDescMap, {
				hostName: this.host.name,
				remoteName: this.remoteInfo.name,
				remoteEntryUrl: this.remoteInfo.entry,
				expose,
				requestId: id,
				availableExposes: getAvailableExposeNames(remoteSnapshot)
			}, void 0, require_context.optionsToMFContext(this.host.options));
			await this.host.loaderHook.lifecycle.afterGetExpose.emit({
				id,
				expose,
				moduleInfo: this.remoteInfo,
				remoteEntryExports,
				moduleFactory,
				origin: this.host
			});
		} catch (getExposeError) {
			await this.host.loaderHook.lifecycle.afterGetExpose.emit({
				id,
				expose,
				moduleInfo: this.remoteInfo,
				remoteEntryExports,
				error: getExposeError,
				origin: this.host
			});
			throw getExposeError;
		}
		const symbolName = require_tool.processModuleAlias(this.remoteInfo.name, expose);
		const wrapModuleFactory = this.wraperFactory(moduleFactory, symbolName);
		if (!loadFactory) return wrapModuleFactory;
		await this.host.loaderHook.lifecycle.beforeExecuteFactory.emit({
			id,
			expose,
			moduleInfo: this.remoteInfo,
			loadFactory,
			origin: this.host
		});
		try {
			const exposeContent = await wrapModuleFactory();
			await this.host.loaderHook.lifecycle.afterExecuteFactory.emit({
				id,
				expose,
				moduleInfo: this.remoteInfo,
				loadFactory,
				exposeModule: exposeContent,
				origin: this.host
			});
			return exposeContent;
		} catch (executeFactoryError) {
			await this.host.loaderHook.lifecycle.afterExecuteFactory.emit({
				id,
				expose,
				moduleInfo: this.remoteInfo,
				loadFactory,
				error: executeFactoryError,
				origin: this.host
			});
			throw executeFactoryError;
		}
	}
	wraperFactory(moduleFactory, id) {
		function defineModuleId(res, id) {
			if (res && typeof res === "object" && Object.isExtensible(res) && !Object.getOwnPropertyDescriptor(res, Symbol.for("mf_module_id"))) Object.defineProperty(res, Symbol.for("mf_module_id"), {
				value: id,
				enumerable: false
			});
		}
		return () => {
			const res = moduleFactory();
			if (res instanceof Promise) return res.then((asyncRes) => {
				defineModuleId(asyncRes, id);
				return asyncRes;
			});
			defineModuleId(res, id);
			return res;
		};
	}
};

//#endregion
exports.Module = Module;
//# sourceMappingURL=index.cjs.map
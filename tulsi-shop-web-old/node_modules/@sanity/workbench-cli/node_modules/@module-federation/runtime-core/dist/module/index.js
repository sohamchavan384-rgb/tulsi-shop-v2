import { assert, error } from "../utils/logger.js";
import { processModuleAlias } from "../utils/tool.js";
import { composeRemoteRequestId } from "../utils/manifest.js";
import { getRemoteEntry } from "../utils/load.js";
import { optionsToMFContext } from "../utils/context.js";
import "../utils/index.js";
import { safeToString } from "@module-federation/sdk";
import { RUNTIME_002, RUNTIME_014, RUNTIME_015, runtimeDescMap } from "@module-federation/error-codes";

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
var Module$1 = class {
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
			id: composeRemoteRequestId(this.remoteInfo.name, expose),
			resourceType: "remoteEntry",
			url: this.remoteInfo.entry,
			expose
		};
		const remoteEntryExports = await getRemoteEntry({
			origin: this.host,
			remoteInfo: this.remoteInfo,
			remoteEntryExports: this.remoteEntryExports,
			resourceContext: effectiveResourceContext
		});
		assert(remoteEntryExports, `remoteEntryExports is undefined \n ${safeToString(this.remoteInfo)}`);
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
			if (typeof remoteEntryExports?.init === "undefined") error(RUNTIME_002, runtimeDescMap, {
				hostName: this.host.name,
				remoteName: this.remoteInfo.name,
				remoteEntryUrl: this.remoteInfo.entry,
				remoteEntryKey: this.remoteInfo.entryGlobalName
			}, void 0, optionsToMFContext(this.host.options));
			try {
				await remoteEntryExports.init(initContainerOptions.shareScope, initContainerOptions.initScope, initContainerOptions.remoteEntryInitOptions);
			} catch (initError) {
				error(RUNTIME_015, runtimeDescMap, {
					hostName: this.host.name,
					remoteName: this.remoteInfo.name,
					remoteEntryUrl: this.remoteInfo.entry,
					remoteEntryKey: this.remoteInfo.entryGlobalName,
					shareScope: this.remoteInfo.shareScope
				}, `${initError}`, optionsToMFContext(this.host.options));
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
			if (!moduleFactory) error(RUNTIME_014, runtimeDescMap, {
				hostName: this.host.name,
				remoteName: this.remoteInfo.name,
				remoteEntryUrl: this.remoteInfo.entry,
				expose,
				requestId: id,
				availableExposes: getAvailableExposeNames(remoteSnapshot)
			}, void 0, optionsToMFContext(this.host.options));
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
		const symbolName = processModuleAlias(this.remoteInfo.name, expose);
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
export { Module$1 as Module };
//# sourceMappingURL=index.js.map
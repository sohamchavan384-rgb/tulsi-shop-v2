import { assert, error, warn } from "../utils/logger.js";
import { DEFAULT_SCOPE } from "../constant.js";
import { addUseIn, directShare, formatShareConfigs, getGlobalShareScope, getRegisteredShare, getTargetSharedOptions, shouldUseTreeShaking } from "../utils/share.js";
import { optionsToMFContext } from "../utils/context.js";
import "../utils/index.js";
import { SyncHook } from "../utils/hooks/syncHook.js";
import { AsyncHook } from "../utils/hooks/asyncHook.js";
import { SyncWaterfallHook } from "../utils/hooks/syncWaterfallHook.js";
import { AsyncWaterfallHook } from "../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../utils/hooks/pluginSystem.js";
import "../utils/hooks/index.js";
import { RUNTIME_005, RUNTIME_006, runtimeDescMap } from "@module-federation/error-codes";

//#region src/shared/index.ts
var SharedHandler = class {
	constructor(host) {
		this.hooks = new PluginSystem({
			beforeRegisterShare: new SyncWaterfallHook("beforeRegisterShare"),
			afterRegisterShare: new SyncHook("afterRegisterShare"),
			afterResolve: new AsyncWaterfallHook("afterResolve"),
			beforeLoadShare: new AsyncWaterfallHook("beforeLoadShare"),
			loadShare: new AsyncHook(),
			afterLoadShare: new SyncHook("afterLoadShare"),
			errorLoadShare: new SyncHook("errorLoadShare"),
			resolveShare: new SyncWaterfallHook("resolveShare"),
			initContainerShareScopeMap: new SyncWaterfallHook("initContainerShareScopeMap")
		});
		this.host = host;
		this.shareScopeMap = {};
		this.initTokens = {};
		this._setGlobalShareScopeMap(host.options);
	}
	emitAfterRegisterShare(pkgName, input) {
		this.hooks.lifecycle.afterRegisterShare.emit({
			pkgName,
			...input,
			shareScopeMap: this.shareScopeMap,
			origin: this.host
		});
	}
	emitAfterLoadShare({ lifecycle, pkgName, shareInfo, selectedShared, loadContext }) {
		try {
			this.hooks.lifecycle.afterLoadShare.emit({
				pkgName,
				shareInfo,
				selectedShared,
				shared: this.host.options.shared,
				shareScopeMap: this.shareScopeMap,
				lifecycle,
				loadContext,
				origin: this.host
			});
		} catch (error) {
			warn(error);
		}
	}
	emitErrorLoadShare({ lifecycle, pkgName, shareInfo, error, recovered, loadContext }) {
		try {
			this.hooks.lifecycle.errorLoadShare.emit({
				pkgName,
				shareInfo,
				shared: this.host.options.shared,
				shareScopeMap: this.shareScopeMap,
				lifecycle,
				origin: this.host,
				error,
				recovered,
				loadContext
			});
		} catch (hookError) {
			warn(hookError);
		}
	}
	registerShared(globalOptions, userOptions) {
		const { newShareInfos, allShareInfos } = formatShareConfigs(globalOptions, userOptions);
		Object.keys(newShareInfos).forEach((sharedKey) => {
			newShareInfos[sharedKey].forEach((sharedVal) => {
				sharedVal.scope.forEach((sc) => {
					this.hooks.lifecycle.beforeRegisterShare.emit({
						origin: this.host,
						pkgName: sharedKey,
						shared: sharedVal
					});
					const registeredShared = this.shareScopeMap[sc]?.[sharedKey];
					const previousAtVersion = registeredShared?.[sharedVal.version];
					if (!registeredShared) this.setShared({
						pkgName: sharedKey,
						lib: sharedVal.lib,
						get: sharedVal.get,
						loaded: sharedVal.loaded || Boolean(sharedVal.lib),
						shared: sharedVal,
						from: userOptions.name
					});
					this.emitAfterRegisterShare(sharedKey, {
						scope: sc,
						shared: sharedVal,
						previousShared: previousAtVersion,
						registeredShared: this.shareScopeMap[sc]?.[sharedKey]?.[sharedVal.version],
						trigger: "runtime"
					});
				});
			});
		});
		return {
			newShareInfos,
			allShareInfos
		};
	}
	async loadShare(pkgName, extraOptions) {
		const { host } = this;
		let loadContext = extraOptions?.context;
		const shareOptions = getTargetSharedOptions({
			pkgName,
			extraOptions,
			shareInfos: host.options.shared
		});
		let shareOptionsRes = shareOptions;
		try {
			if (shareOptions?.scope) await Promise.all(shareOptions.scope.map(async (shareScope) => {
				await Promise.all(this.initializeSharing(shareScope, {
					strategy: shareOptions.strategy,
					context: loadContext
				}));
			}));
			const loadShareRes = await this.hooks.lifecycle.beforeLoadShare.emit({
				pkgName,
				shareInfo: shareOptions,
				shared: host.options.shared,
				origin: host,
				loadContext
			});
			shareOptionsRes = loadShareRes.shareInfo;
			loadContext = loadShareRes.loadContext || loadContext;
			assert(shareOptionsRes, `Cannot find shared "${pkgName}" in host "${host.options.name}". Ensure the shared config for "${pkgName}" is declared in the federation plugin options and the host has been initialized before loading shares.`);
			const resolvedShareOptions = shareOptionsRes;
			const { shared: registeredShared, useTreesShaking } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare, loadContext) || {};
			if (registeredShared) {
				const targetShared = directShare(registeredShared, useTreesShaking);
				if (targetShared.lib) {
					addUseIn(targetShared, host.options.name);
					this.emitAfterLoadShare({
						lifecycle: "loadShare",
						pkgName,
						shareInfo: resolvedShareOptions,
						selectedShared: registeredShared,
						loadContext
					});
					return targetShared.lib;
				} else if (targetShared.loading && !targetShared.loaded) {
					const factory = await targetShared.loading;
					targetShared.loaded = true;
					if (!targetShared.lib) targetShared.lib = factory;
					addUseIn(targetShared, host.options.name);
					this.emitAfterLoadShare({
						lifecycle: "loadShare",
						pkgName,
						shareInfo: resolvedShareOptions,
						selectedShared: registeredShared,
						loadContext
					});
					return factory;
				} else {
					const asyncLoadProcess = async () => {
						const factory = await targetShared.get();
						addUseIn(targetShared, host.options.name);
						targetShared.loaded = true;
						targetShared.lib = factory;
						return factory;
					};
					const loading = asyncLoadProcess();
					this.setShared({
						pkgName,
						loaded: false,
						shared: registeredShared,
						from: host.options.name,
						lib: null,
						loading,
						treeShaking: useTreesShaking ? targetShared : void 0
					});
					const factory = await loading;
					this.emitAfterLoadShare({
						lifecycle: "loadShare",
						pkgName,
						shareInfo: resolvedShareOptions,
						selectedShared: registeredShared,
						loadContext
					});
					return factory;
				}
			} else {
				if (extraOptions?.customShareInfo) {
					this.emitErrorLoadShare({
						lifecycle: "loadShare",
						pkgName,
						shareInfo: resolvedShareOptions,
						recovered: true,
						loadContext
					});
					return false;
				}
				const _useTreeShaking = shouldUseTreeShaking(resolvedShareOptions.treeShaking);
				const targetShared = directShare(resolvedShareOptions, _useTreeShaking);
				const asyncLoadProcess = async () => {
					const factory = await targetShared.get();
					targetShared.lib = factory;
					targetShared.loaded = true;
					addUseIn(targetShared, host.options.name);
					const { shared: gShared, useTreesShaking: gUseTreeShaking } = getRegisteredShare(this.shareScopeMap, pkgName, resolvedShareOptions, this.hooks.lifecycle.resolveShare, loadContext) || {};
					if (gShared) {
						const targetGShared = directShare(gShared, gUseTreeShaking);
						targetGShared.lib = factory;
						targetGShared.loaded = true;
						gShared.from = resolvedShareOptions.from;
					}
					return factory;
				};
				const loading = asyncLoadProcess();
				this.setShared({
					pkgName,
					loaded: false,
					shared: resolvedShareOptions,
					from: host.options.name,
					lib: null,
					loading,
					treeShaking: _useTreeShaking ? targetShared : void 0
				});
				const factory = await loading;
				this.emitAfterLoadShare({
					lifecycle: "loadShare",
					pkgName,
					shareInfo: resolvedShareOptions,
					selectedShared: resolvedShareOptions,
					loadContext
				});
				return factory;
			}
		} catch (shareError) {
			this.emitErrorLoadShare({
				lifecycle: "loadShare",
				pkgName,
				shareInfo: shareOptionsRes,
				error: shareError,
				loadContext
			});
			throw shareError;
		}
	}
	/**
	* This function initializes the sharing sequence (executed only once per share scope).
	* It accepts one argument, the name of the share scope.
	* If the share scope does not exist, it creates one.
	*/
	initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
		const { host } = this;
		const from = extraOptions?.from;
		const strategy = extraOptions?.strategy;
		const trigger = extraOptions?.context?.trigger || from || "runtime";
		let initScope = extraOptions?.initScope;
		const promises = [];
		if (from !== "build") {
			const { initTokens } = this;
			if (!initScope) initScope = [];
			let initToken = initTokens[shareScopeName];
			if (!initToken) initToken = initTokens[shareScopeName] = { from: this.host.name };
			if (initScope.indexOf(initToken) >= 0) return promises;
			initScope.push(initToken);
		}
		const shareScope = this.shareScopeMap;
		const hostName = host.options.name;
		if (!shareScope[shareScopeName]) shareScope[shareScopeName] = {};
		const scope = shareScope[shareScopeName];
		const register = (name, shared) => {
			const { version, eager } = shared;
			scope[name] = scope[name] || {};
			const versions = scope[name];
			const existingShared = versions[version];
			const activeVersion = existingShared && directShare(existingShared);
			const activeVersionEager = Boolean(activeVersion && ("eager" in activeVersion && activeVersion.eager || "shareConfig" in activeVersion && activeVersion.shareConfig?.eager));
			if (Boolean(!activeVersion || activeVersion.strategy !== "loaded-first" && !activeVersion.loaded && (Boolean(!eager) !== !activeVersionEager ? eager : hostName > versions[version].from))) versions[version] = shared;
			this.emitAfterRegisterShare(name, {
				scope: shareScopeName,
				shared,
				previousShared: existingShared,
				registeredShared: versions[version],
				trigger
			});
		};
		const initRemoteModule = async (key) => {
			const { module } = await host.remoteHandler.getRemoteModuleAndOptions({ id: key });
			let remoteEntryExports = void 0;
			const resourceContext = {
				initiator: "loadShare",
				id: key,
				resourceType: "remoteEntry",
				url: module.remoteInfo.entry
			};
			try {
				remoteEntryExports = await module.getEntry(void 0, resourceContext);
			} catch (error) {
				remoteEntryExports = await host.remoteHandler.hooks.lifecycle.errorLoadRemote.emit({
					id: key,
					error,
					from: "runtime",
					lifecycle: "beforeLoadShare",
					remote: module.remoteInfo,
					origin: host
				});
				if (!remoteEntryExports) return;
			} finally {
				if (remoteEntryExports?.init && !module.initing) {
					module.remoteEntryExports = remoteEntryExports;
					await module.init(void 0, void 0, initScope, void 0, resourceContext);
				}
			}
		};
		Object.keys(host.options.shared).forEach((shareName) => {
			host.options.shared[shareName].forEach((shared) => {
				if (shared.scope.includes(shareScopeName)) register(shareName, shared);
			});
		});
		if (host.options.shareStrategy === "version-first" || strategy === "version-first") host.options.remotes.forEach((remote) => {
			if (remote.shareScope === shareScopeName) promises.push(initRemoteModule(remote.name));
		});
		return promises;
	}
	loadShareSync(pkgName, extraOptions) {
		const { host } = this;
		const loadContext = extraOptions?.context;
		const shareOptions = getTargetSharedOptions({
			pkgName,
			extraOptions,
			shareInfos: host.options.shared
		});
		try {
			if (shareOptions?.scope) shareOptions.scope.forEach((shareScope) => {
				this.initializeSharing(shareScope, {
					strategy: shareOptions.strategy,
					from: extraOptions?.from,
					context: loadContext
				});
			});
			const { shared: registeredShared } = getRegisteredShare(this.shareScopeMap, pkgName, shareOptions, this.hooks.lifecycle.resolveShare, loadContext) || {};
			if (registeredShared) {
				if (typeof registeredShared.lib === "function") {
					addUseIn(registeredShared, host.options.name);
					if (!registeredShared.loaded) {
						registeredShared.loaded = true;
						if (registeredShared.from === host.options.name) shareOptions.loaded = true;
					}
					this.emitAfterLoadShare({
						lifecycle: "loadShareSync",
						pkgName,
						shareInfo: shareOptions,
						selectedShared: registeredShared,
						loadContext
					});
					return registeredShared.lib;
				}
				if (typeof registeredShared.get === "function") {
					const module = registeredShared.get();
					if (!(module instanceof Promise)) {
						addUseIn(registeredShared, host.options.name);
						this.setShared({
							pkgName,
							loaded: true,
							from: host.options.name,
							lib: module,
							shared: registeredShared
						});
						this.emitAfterLoadShare({
							lifecycle: "loadShareSync",
							pkgName,
							shareInfo: shareOptions,
							selectedShared: registeredShared,
							loadContext
						});
						return module;
					}
				}
			}
			if (shareOptions.lib) {
				if (!shareOptions.loaded) shareOptions.loaded = true;
				this.emitAfterLoadShare({
					lifecycle: "loadShareSync",
					pkgName,
					shareInfo: shareOptions,
					selectedShared: shareOptions,
					loadContext
				});
				return shareOptions.lib;
			}
			if (shareOptions.get) {
				const module = shareOptions.get();
				if (module instanceof Promise) error(extraOptions?.from === "build" ? RUNTIME_005 : RUNTIME_006, runtimeDescMap, {
					hostName: host.options.name,
					sharedPkgName: pkgName
				}, void 0, optionsToMFContext(host.options));
				shareOptions.lib = module;
				this.setShared({
					pkgName,
					loaded: true,
					from: host.options.name,
					lib: shareOptions.lib,
					shared: shareOptions
				});
				this.emitAfterLoadShare({
					lifecycle: "loadShareSync",
					pkgName,
					shareInfo: shareOptions,
					selectedShared: shareOptions,
					loadContext
				});
				return shareOptions.lib;
			}
			error(RUNTIME_006, runtimeDescMap, {
				hostName: host.options.name,
				sharedPkgName: pkgName
			}, void 0, optionsToMFContext(host.options));
		} catch (shareError) {
			this.emitErrorLoadShare({
				lifecycle: "loadShareSync",
				pkgName,
				shareInfo: shareOptions,
				error: shareError,
				loadContext
			});
			throw shareError;
		}
	}
	initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
		const { host } = this;
		this.shareScopeMap[scopeName] = shareScope;
		this.hooks.lifecycle.initContainerShareScopeMap.emit({
			shareScope,
			options: host.options,
			origin: host,
			scopeName,
			hostShareScopeMap: extraOptions.hostShareScopeMap
		});
	}
	setShared({ pkgName, shared, from, lib, loading, loaded, get, treeShaking }) {
		const { version, scope = "default", ...shareInfo } = shared;
		const scopes = Array.isArray(scope) ? scope : [scope];
		const mergeAttrs = (shared) => {
			const merge = (s, key, val) => {
				if (val && !s[key]) s[key] = val;
			};
			const targetShared = treeShaking ? shared.treeShaking : shared;
			merge(targetShared, "loaded", loaded);
			merge(targetShared, "loading", loading);
			merge(targetShared, "get", get);
			merge(targetShared, "lib", lib);
		};
		scopes.forEach((sc) => {
			if (!this.shareScopeMap[sc]) this.shareScopeMap[sc] = {};
			if (!this.shareScopeMap[sc][pkgName]) this.shareScopeMap[sc][pkgName] = {};
			if (!this.shareScopeMap[sc][pkgName][version]) this.shareScopeMap[sc][pkgName][version] = {
				version,
				scope: [sc],
				...shareInfo,
				lib
			};
			const registeredShared = this.shareScopeMap[sc][pkgName][version];
			mergeAttrs(registeredShared);
			if (from && registeredShared.from !== from) registeredShared.from = from;
		});
	}
	_setGlobalShareScopeMap(hostOptions) {
		const globalShareScopeMap = getGlobalShareScope();
		const identifier = hostOptions.id || hostOptions.name;
		if (identifier && !globalShareScopeMap[identifier]) globalShareScopeMap[identifier] = this.shareScopeMap;
	}
};

//#endregion
export { SharedHandler };
//# sourceMappingURL=index.js.map
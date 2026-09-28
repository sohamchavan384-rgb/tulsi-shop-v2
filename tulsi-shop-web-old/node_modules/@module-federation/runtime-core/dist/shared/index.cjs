const require_logger = require('../utils/logger.cjs');
const require_constant = require('../constant.cjs');
const require_share = require('../utils/share.cjs');
const require_context = require('../utils/context.cjs');
require('../utils/index.cjs');
const require_syncHook = require('../utils/hooks/syncHook.cjs');
const require_asyncHook = require('../utils/hooks/asyncHook.cjs');
const require_syncWaterfallHook = require('../utils/hooks/syncWaterfallHook.cjs');
const require_asyncWaterfallHooks = require('../utils/hooks/asyncWaterfallHooks.cjs');
const require_pluginSystem = require('../utils/hooks/pluginSystem.cjs');
require('../utils/hooks/index.cjs');
let _module_federation_error_codes = require("@module-federation/error-codes");

//#region src/shared/index.ts
var SharedHandler = class {
	constructor(host) {
		this.hooks = new require_pluginSystem.PluginSystem({
			beforeRegisterShare: new require_syncWaterfallHook.SyncWaterfallHook("beforeRegisterShare"),
			afterRegisterShare: new require_syncHook.SyncHook("afterRegisterShare"),
			afterResolve: new require_asyncWaterfallHooks.AsyncWaterfallHook("afterResolve"),
			beforeLoadShare: new require_asyncWaterfallHooks.AsyncWaterfallHook("beforeLoadShare"),
			loadShare: new require_asyncHook.AsyncHook(),
			afterLoadShare: new require_syncHook.SyncHook("afterLoadShare"),
			errorLoadShare: new require_syncHook.SyncHook("errorLoadShare"),
			resolveShare: new require_syncWaterfallHook.SyncWaterfallHook("resolveShare"),
			initContainerShareScopeMap: new require_syncWaterfallHook.SyncWaterfallHook("initContainerShareScopeMap")
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
			require_logger.warn(error);
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
			require_logger.warn(hookError);
		}
	}
	registerShared(globalOptions, userOptions) {
		const { newShareInfos, allShareInfos } = require_share.formatShareConfigs(globalOptions, userOptions);
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
		const shareOptions = require_share.getTargetSharedOptions({
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
			require_logger.assert(shareOptionsRes, `Cannot find shared "${pkgName}" in host "${host.options.name}". Ensure the shared config for "${pkgName}" is declared in the federation plugin options and the host has been initialized before loading shares.`);
			const resolvedShareOptions = shareOptionsRes;
			const { shared: registeredShared, useTreesShaking } = require_share.getRegisteredShare(this.shareScopeMap, pkgName, shareOptionsRes, this.hooks.lifecycle.resolveShare, loadContext) || {};
			if (registeredShared) {
				const targetShared = require_share.directShare(registeredShared, useTreesShaking);
				if (targetShared.lib) {
					require_share.addUseIn(targetShared, host.options.name);
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
					require_share.addUseIn(targetShared, host.options.name);
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
						require_share.addUseIn(targetShared, host.options.name);
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
				const _useTreeShaking = require_share.shouldUseTreeShaking(resolvedShareOptions.treeShaking);
				const targetShared = require_share.directShare(resolvedShareOptions, _useTreeShaking);
				const asyncLoadProcess = async () => {
					const factory = await targetShared.get();
					targetShared.lib = factory;
					targetShared.loaded = true;
					require_share.addUseIn(targetShared, host.options.name);
					const { shared: gShared, useTreesShaking: gUseTreeShaking } = require_share.getRegisteredShare(this.shareScopeMap, pkgName, resolvedShareOptions, this.hooks.lifecycle.resolveShare, loadContext) || {};
					if (gShared) {
						const targetGShared = require_share.directShare(gShared, gUseTreeShaking);
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
	initializeSharing(shareScopeName = require_constant.DEFAULT_SCOPE, extraOptions) {
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
			const activeVersion = existingShared && require_share.directShare(existingShared);
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
		const shareOptions = require_share.getTargetSharedOptions({
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
			const { shared: registeredShared } = require_share.getRegisteredShare(this.shareScopeMap, pkgName, shareOptions, this.hooks.lifecycle.resolveShare, loadContext) || {};
			if (registeredShared) {
				if (typeof registeredShared.lib === "function") {
					require_share.addUseIn(registeredShared, host.options.name);
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
						require_share.addUseIn(registeredShared, host.options.name);
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
				if (module instanceof Promise) require_logger.error(extraOptions?.from === "build" ? _module_federation_error_codes.RUNTIME_005 : _module_federation_error_codes.RUNTIME_006, _module_federation_error_codes.runtimeDescMap, {
					hostName: host.options.name,
					sharedPkgName: pkgName
				}, void 0, require_context.optionsToMFContext(host.options));
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
			require_logger.error(_module_federation_error_codes.RUNTIME_006, _module_federation_error_codes.runtimeDescMap, {
				hostName: host.options.name,
				sharedPkgName: pkgName
			}, void 0, require_context.optionsToMFContext(host.options));
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
		const globalShareScopeMap = require_share.getGlobalShareScope();
		const identifier = hostOptions.id || hostOptions.name;
		if (identifier && !globalShareScopeMap[identifier]) globalShareScopeMap[identifier] = this.shareScopeMap;
	}
};

//#endregion
exports.SharedHandler = SharedHandler;
//# sourceMappingURL=index.cjs.map
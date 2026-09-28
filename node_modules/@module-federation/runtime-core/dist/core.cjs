const require_logger = require('./utils/logger.cjs');
const require_constant = require('./constant.cjs');
const require_share = require('./utils/share.cjs');
const require_env = require('./utils/env.cjs');
const require_plugin = require('./utils/plugin.cjs');
require('./utils/index.cjs');
const require_syncHook = require('./utils/hooks/syncHook.cjs');
const require_asyncHook = require('./utils/hooks/asyncHook.cjs');
const require_syncWaterfallHook = require('./utils/hooks/syncWaterfallHook.cjs');
const require_asyncWaterfallHooks = require('./utils/hooks/asyncWaterfallHooks.cjs');
const require_pluginSystem = require('./utils/hooks/pluginSystem.cjs');
require('./utils/hooks/index.cjs');
const require_disabled = require('./remote/disabled.cjs');
const require_index$2 = require('./plugins/snapshot/index.cjs');
const require_generate_preload_assets = require('./plugins/generate-preload-assets.cjs');
const require_SnapshotHandler = require('./plugins/snapshot/SnapshotHandler.cjs');
const require_disabled$1 = require('./plugins/snapshot/disabled.cjs');
const require_index$3 = require('./shared/index.cjs');
const require_disabled$2 = require('./shared/disabled.cjs');
const require_index$4 = require('./remote/index.cjs');
let _module_federation_sdk = require("@module-federation/sdk");
let _module_federation_error_codes = require("@module-federation/error-codes");

//#region src/core.ts
const USE_SNAPSHOT = typeof FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN === "boolean" ? !FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN : true;
const USE_REMOTE = typeof FEDERATION_OPTIMIZE_NO_REMOTE === "boolean" ? !FEDERATION_OPTIMIZE_NO_REMOTE : true;
const USE_SHARED = typeof FEDERATION_OPTIMIZE_NO_SHARED === "boolean" ? !FEDERATION_OPTIMIZE_NO_SHARED : true;
var ModuleFederation = class {
	constructor(userOptions) {
		this.hooks = new require_pluginSystem.PluginSystem({
			beforeInit: new require_syncWaterfallHook.SyncWaterfallHook("beforeInit"),
			init: new require_syncHook.SyncHook(),
			beforeInitContainer: new require_asyncWaterfallHooks.AsyncWaterfallHook("beforeInitContainer"),
			initContainer: new require_asyncWaterfallHooks.AsyncWaterfallHook("initContainer")
		});
		this.version = "2.9.0";
		this.moduleCache = /* @__PURE__ */ new Map();
		this.loaderHook = new require_pluginSystem.PluginSystem({
			getModuleInfo: new require_syncHook.SyncHook(),
			createScript: new require_syncHook.SyncHook(),
			createLink: new require_syncHook.SyncHook(),
			fetch: new require_asyncHook.AsyncHook(),
			loadEntryError: new require_asyncHook.AsyncHook(),
			afterLoadEntry: new require_asyncHook.AsyncHook("afterLoadEntry"),
			beforeInitRemote: new require_asyncHook.AsyncHook("beforeInitRemote"),
			afterInitRemote: new require_asyncHook.AsyncHook("afterInitRemote"),
			beforeGetExpose: new require_asyncHook.AsyncHook("beforeGetExpose"),
			afterGetExpose: new require_asyncHook.AsyncHook("afterGetExpose"),
			beforeExecuteFactory: new require_asyncHook.AsyncHook("beforeExecuteFactory"),
			afterExecuteFactory: new require_asyncHook.AsyncHook("afterExecuteFactory"),
			getModuleFactory: new require_asyncHook.AsyncHook()
		});
		this.bridgeHook = new require_pluginSystem.PluginSystem({
			beforeBridgeRender: new require_syncHook.SyncHook(),
			afterBridgeRender: new require_syncHook.SyncHook(),
			beforeBridgeDestroy: new require_syncHook.SyncHook(),
			afterBridgeDestroy: new require_syncHook.SyncHook(),
			afterBridgeRouteSync: new require_syncHook.SyncHook()
		});
		const plugins = USE_REMOTE && USE_SNAPSHOT ? [require_index$2.snapshotPlugin(), require_generate_preload_assets.generatePreloadAssetsPlugin()] : [];
		const defaultOptions = {
			id: require_env.getBuilderId(),
			name: userOptions.name,
			plugins,
			remotes: [],
			shared: {},
			inBrowser: _module_federation_sdk.isBrowserEnvValue
		};
		this.name = userOptions.name;
		this.options = defaultOptions;
		this.snapshotHandler = USE_REMOTE ? new require_SnapshotHandler.SnapshotHandler(this) : new require_disabled$1.DisabledSnapshotHandler();
		this.sharedHandler = USE_SHARED ? new require_index$3.SharedHandler(this) : new require_disabled$2.DisabledSharedHandler();
		this.remoteHandler = USE_REMOTE ? new require_index$4.RemoteHandler(this) : new require_disabled.DisabledRemoteHandler();
		this.shareScopeMap = this.sharedHandler.shareScopeMap;
		this.registerPlugins([...defaultOptions.plugins, ...userOptions.plugins || []]);
		this.options = this.formatOptions(defaultOptions, userOptions);
	}
	initOptions(userOptions) {
		if (userOptions.name && userOptions.name !== this.options.name) require_logger.error((0, _module_federation_error_codes.getShortErrorMsg)(_module_federation_error_codes.RUNTIME_010, _module_federation_error_codes.runtimeDescMap));
		this.registerPlugins(userOptions.plugins);
		const options = this.formatOptions(this.options, userOptions);
		this.options = options;
		return options;
	}
	async loadShare(pkgName, extraOptions) {
		return this.sharedHandler.loadShare(pkgName, extraOptions);
	}
	loadShareSync(pkgName, extraOptions) {
		return this.sharedHandler.loadShareSync(pkgName, extraOptions);
	}
	initializeSharing(shareScopeName = require_constant.DEFAULT_SCOPE, extraOptions) {
		return this.sharedHandler.initializeSharing(shareScopeName, extraOptions);
	}
	initRawContainer(name, url, container) {
		return this.remoteHandler.initRawContainer(name, url, container);
	}
	async loadRemote(id, options) {
		return this.remoteHandler.loadRemote(id, options);
	}
	async preloadRemote(preloadOptions) {
		return this.remoteHandler.preloadRemote(preloadOptions);
	}
	initShareScopeMap(scopeName, shareScope, extraOptions = {}) {
		this.sharedHandler.initShareScopeMap(scopeName, shareScope, extraOptions);
	}
	formatOptions(globalOptions, userOptions) {
		const shared = USE_SHARED ? require_share.formatShareConfigs(globalOptions, userOptions).allShareInfos : {};
		const { userOptions: userOptionsRes, options: globalOptionsRes } = this.hooks.lifecycle.beforeInit.emit({
			origin: this,
			userOptions,
			options: globalOptions,
			shareInfo: shared
		});
		const remotes = this.remoteHandler.formatAndRegisterRemote(globalOptionsRes, userOptionsRes);
		const { allShareInfos } = this.sharedHandler.registerShared(globalOptionsRes, userOptionsRes);
		const plugins = [...globalOptionsRes.plugins];
		if (userOptionsRes.plugins) userOptionsRes.plugins.forEach((plugin) => {
			if (!plugins.includes(plugin)) plugins.push(plugin);
		});
		const optionsRes = {
			...globalOptions,
			...userOptions,
			plugins,
			remotes,
			shared: allShareInfos,
			id: userOptionsRes.id || globalOptions.id
		};
		this.hooks.lifecycle.init.emit({
			origin: this,
			options: optionsRes
		});
		return optionsRes;
	}
	registerPlugins(plugins) {
		this.options.plugins = require_plugin.registerPlugins(plugins, this);
	}
	registerRemotes(remotes, options) {
		return this.remoteHandler.registerRemotes(remotes, options);
	}
	registerShared(shared) {
		this.sharedHandler.registerShared(this.options, {
			...this.options,
			shared
		});
	}
};

//#endregion
exports.ModuleFederation = ModuleFederation;
//# sourceMappingURL=core.cjs.map
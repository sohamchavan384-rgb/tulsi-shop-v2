import { error } from "./utils/logger.js";
import { DEFAULT_SCOPE } from "./constant.js";
import { formatShareConfigs } from "./utils/share.js";
import { getBuilderId } from "./utils/env.js";
import { registerPlugins } from "./utils/plugin.js";
import "./utils/index.js";
import { SyncHook } from "./utils/hooks/syncHook.js";
import { AsyncHook } from "./utils/hooks/asyncHook.js";
import { SyncWaterfallHook } from "./utils/hooks/syncWaterfallHook.js";
import { AsyncWaterfallHook } from "./utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "./utils/hooks/pluginSystem.js";
import "./utils/hooks/index.js";
import { DisabledRemoteHandler } from "./remote/disabled.js";
import { snapshotPlugin } from "./plugins/snapshot/index.js";
import { generatePreloadAssetsPlugin } from "./plugins/generate-preload-assets.js";
import { SnapshotHandler } from "./plugins/snapshot/SnapshotHandler.js";
import { DisabledSnapshotHandler } from "./plugins/snapshot/disabled.js";
import { SharedHandler } from "./shared/index.js";
import { DisabledSharedHandler } from "./shared/disabled.js";
import { RemoteHandler } from "./remote/index.js";
import { isBrowserEnvValue } from "@module-federation/sdk";
import { RUNTIME_010, getShortErrorMsg, runtimeDescMap } from "@module-federation/error-codes";

//#region src/core.ts
const USE_SNAPSHOT = typeof FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN === "boolean" ? !FEDERATION_OPTIMIZE_NO_SNAPSHOT_PLUGIN : true;
const USE_REMOTE = typeof FEDERATION_OPTIMIZE_NO_REMOTE === "boolean" ? !FEDERATION_OPTIMIZE_NO_REMOTE : true;
const USE_SHARED = typeof FEDERATION_OPTIMIZE_NO_SHARED === "boolean" ? !FEDERATION_OPTIMIZE_NO_SHARED : true;
var ModuleFederation = class {
	constructor(userOptions) {
		this.hooks = new PluginSystem({
			beforeInit: new SyncWaterfallHook("beforeInit"),
			init: new SyncHook(),
			beforeInitContainer: new AsyncWaterfallHook("beforeInitContainer"),
			initContainer: new AsyncWaterfallHook("initContainer")
		});
		this.version = "2.9.0";
		this.moduleCache = /* @__PURE__ */ new Map();
		this.loaderHook = new PluginSystem({
			getModuleInfo: new SyncHook(),
			createScript: new SyncHook(),
			createLink: new SyncHook(),
			fetch: new AsyncHook(),
			loadEntryError: new AsyncHook(),
			afterLoadEntry: new AsyncHook("afterLoadEntry"),
			beforeInitRemote: new AsyncHook("beforeInitRemote"),
			afterInitRemote: new AsyncHook("afterInitRemote"),
			beforeGetExpose: new AsyncHook("beforeGetExpose"),
			afterGetExpose: new AsyncHook("afterGetExpose"),
			beforeExecuteFactory: new AsyncHook("beforeExecuteFactory"),
			afterExecuteFactory: new AsyncHook("afterExecuteFactory"),
			getModuleFactory: new AsyncHook()
		});
		this.bridgeHook = new PluginSystem({
			beforeBridgeRender: new SyncHook(),
			afterBridgeRender: new SyncHook(),
			beforeBridgeDestroy: new SyncHook(),
			afterBridgeDestroy: new SyncHook(),
			afterBridgeRouteSync: new SyncHook()
		});
		const plugins = USE_REMOTE && USE_SNAPSHOT ? [snapshotPlugin(), generatePreloadAssetsPlugin()] : [];
		const defaultOptions = {
			id: getBuilderId(),
			name: userOptions.name,
			plugins,
			remotes: [],
			shared: {},
			inBrowser: isBrowserEnvValue
		};
		this.name = userOptions.name;
		this.options = defaultOptions;
		this.snapshotHandler = USE_REMOTE ? new SnapshotHandler(this) : new DisabledSnapshotHandler();
		this.sharedHandler = USE_SHARED ? new SharedHandler(this) : new DisabledSharedHandler();
		this.remoteHandler = USE_REMOTE ? new RemoteHandler(this) : new DisabledRemoteHandler();
		this.shareScopeMap = this.sharedHandler.shareScopeMap;
		this.registerPlugins([...defaultOptions.plugins, ...userOptions.plugins || []]);
		this.options = this.formatOptions(defaultOptions, userOptions);
	}
	initOptions(userOptions) {
		if (userOptions.name && userOptions.name !== this.options.name) error(getShortErrorMsg(RUNTIME_010, runtimeDescMap));
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
	initializeSharing(shareScopeName = DEFAULT_SCOPE, extraOptions) {
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
		const shared = USE_SHARED ? formatShareConfigs(globalOptions, userOptions).allShareInfos : {};
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
		this.options.plugins = registerPlugins(plugins, this);
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
export { ModuleFederation };
//# sourceMappingURL=core.js.map
import { Module as Module$1, RemoteModuleFactory } from "./module/index.js";
import { SyncHook } from "./utils/hooks/syncHook.js";
import { AsyncHook } from "./utils/hooks/asyncHook.js";
import { SyncWaterfallHook } from "./utils/hooks/syncWaterfallHook.js";
import { AsyncWaterfallHook } from "./utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "./utils/hooks/pluginSystem.js";
import { SnapshotHandler } from "./plugins/snapshot/SnapshotHandler.js";
import { RemoteHandler } from "./remote/index.js";
import { SharedHandler } from "./shared/index.js";
import { CallFrom, InitScope, LoadShareExtraOptions, Options, Remote, RemoteEntryExports, RemoteEntryInitOptions, RemoteInfo, ShareInfos, ShareScopeMap, Shared, SharedLoadContext, UserOptions } from "./type/config.js";
import { PreloadRemoteArgs, ResourceLoadContext } from "./type/preload.js";
import { getRemoteEntry } from "./utils/load.js";
import { CreateLinkHookReturnDom, CreateScriptHookReturn, GlobalModuleInfo, ModuleInfo } from "@module-federation/sdk";

//#region src/core.d.ts
type BridgeHookContext = object;
type BridgeHookResult = {
  context: BridgeHookContext;
  result?: unknown;
};
declare class ModuleFederation {
  options: Options;
  hooks: PluginSystem<{
    beforeInit: SyncWaterfallHook<{
      userOptions: UserOptions;
      options: Options;
      origin: ModuleFederation;
      /**
       * @deprecated shareInfo will be removed soon, please use userOptions directly!
       */
      shareInfo: ShareInfos;
    }>;
    init: SyncHook<[{
      options: Options;
      origin: ModuleFederation;
    }], void>;
    beforeInitContainer: AsyncWaterfallHook<{
      shareScope: ShareScopeMap[string];
      initScope: InitScope;
      remoteEntryInitOptions: RemoteEntryInitOptions;
      remoteInfo: RemoteInfo;
      origin: ModuleFederation;
    }>;
    initContainer: AsyncWaterfallHook<{
      shareScope: ShareScopeMap[string];
      initScope: InitScope;
      remoteEntryInitOptions: RemoteEntryInitOptions;
      remoteInfo: RemoteInfo;
      remoteEntryExports: RemoteEntryExports;
      origin: ModuleFederation;
      id?: string;
      remoteSnapshot?: ModuleInfo;
    }>;
  }>;
  version: string;
  name: string;
  moduleCache: Map<string, Module$1>;
  snapshotHandler: SnapshotHandler;
  sharedHandler: SharedHandler;
  remoteHandler: RemoteHandler;
  shareScopeMap: ShareScopeMap;
  loaderHook: PluginSystem<{
    getModuleInfo: SyncHook<[{
      target: Record<string, any>;
      key: any;
    }], void | {
      value: any | undefined;
      key: string;
    }>;
    createScript: SyncHook<[{
      url: string;
      attrs?: Record<string, any>;
      /**
       * The producer(remote) info bound to this resource.
       * Only present when the loader is invoked in a remote-related context
       * (e.g. preloadRemote / loading remoteEntry).
       */
      remoteInfo?: RemoteInfo;
      resourceContext?: ResourceLoadContext;
    }], CreateScriptHookReturn>;
    createLink: SyncHook<[{
      url: string;
      attrs?: Record<string, any>;
      /**
       * The producer(remote) info bound to this resource.
       * Only present when the loader is invoked in a remote-related context
       * (e.g. preloadRemote / loading remoteEntry).
       */
      remoteInfo?: RemoteInfo;
      resourceContext?: ResourceLoadContext;
    }], CreateLinkHookReturnDom>;
    fetch: AsyncHook<[string, RequestInit, (RemoteInfo | undefined)?, (ResourceLoadContext | undefined)?], false | void | Promise<Response>>;
    loadEntryError: AsyncHook<[{
      getRemoteEntry: typeof getRemoteEntry;
      origin: ModuleFederation;
      remoteInfo: RemoteInfo;
      remoteEntryExports?: RemoteEntryExports | undefined;
      globalLoading: Record<string, Promise<void | RemoteEntryExports> | undefined>;
      uniqueKey: string;
    }], Promise<Promise<RemoteEntryExports | undefined> | undefined>>;
    afterLoadEntry: AsyncHook<[{
      origin: ModuleFederation;
      remoteInfo: RemoteInfo;
      remoteEntryExports?: false | void | RemoteEntryExports | undefined;
      resourceContext?: ResourceLoadContext;
      cached?: boolean;
      error?: unknown;
      recovered?: boolean;
    }], void>;
    beforeInitRemote: AsyncHook<[{
      id?: string;
      remoteInfo: RemoteInfo;
      remoteSnapshot?: ModuleInfo;
      origin: ModuleFederation;
    }], void>;
    afterInitRemote: AsyncHook<[{
      id?: string;
      remoteInfo: RemoteInfo;
      remoteSnapshot?: ModuleInfo;
      remoteEntryExports?: RemoteEntryExports;
      error?: unknown;
      cached?: boolean;
      origin: ModuleFederation;
    }], void>;
    beforeGetExpose: AsyncHook<[{
      id: string;
      expose: string;
      moduleInfo: RemoteInfo;
      remoteEntryExports: RemoteEntryExports;
      origin: ModuleFederation;
    }], void>;
    afterGetExpose: AsyncHook<[{
      id: string;
      expose: string;
      moduleInfo: RemoteInfo;
      remoteEntryExports: RemoteEntryExports;
      moduleFactory?: RemoteModuleFactory;
      error?: unknown;
      origin: ModuleFederation;
    }], void>;
    beforeExecuteFactory: AsyncHook<[{
      id: string;
      expose: string;
      moduleInfo: RemoteInfo;
      loadFactory: boolean;
      origin: ModuleFederation;
    }], void>;
    afterExecuteFactory: AsyncHook<[{
      id: string;
      expose: string;
      moduleInfo: RemoteInfo;
      loadFactory: boolean;
      exposeModule?: unknown;
      error?: unknown;
      origin: ModuleFederation;
    }], void>;
    getModuleFactory: AsyncHook<[{
      remoteEntryExports: RemoteEntryExports;
      expose: string;
      moduleInfo: RemoteInfo;
    }], RemoteModuleFactory | Promise<RemoteModuleFactory | undefined> | undefined>;
  }>;
  bridgeHook: PluginSystem<{
    beforeBridgeRender: SyncHook<[Record<string, any>, (object | undefined)?], void | Record<string, any>>;
    afterBridgeRender: SyncHook<[Record<string, any>, (BridgeHookResult | undefined)?], void | Record<string, any>>;
    beforeBridgeDestroy: SyncHook<[Record<string, any>, (object | undefined)?], void | Record<string, any>>;
    afterBridgeDestroy: SyncHook<[Record<string, any>, (BridgeHookResult | undefined)?], void | Record<string, any>>;
    afterBridgeRouteSync: SyncHook<[BridgeHookResult], void>;
  }>;
  moduleInfo?: GlobalModuleInfo[string];
  constructor(userOptions: UserOptions);
  initOptions(userOptions: UserOptions): Options;
  loadShare<T>(pkgName: string, extraOptions?: LoadShareExtraOptions): Promise<false | (() => T | undefined)>;
  loadShareSync<T>(pkgName: string, extraOptions?: LoadShareExtraOptions): () => T | never;
  initializeSharing(shareScopeName?: string, extraOptions?: {
    initScope?: InitScope;
    from?: CallFrom;
    strategy?: Shared['strategy'];
    context?: SharedLoadContext;
  }): Array<Promise<void>>;
  initRawContainer(name: string, url: string, container: RemoteEntryExports): Module$1;
  loadRemote<T>(id: string, options?: {
    loadFactory?: boolean;
    from: CallFrom;
  }): Promise<T | null>;
  preloadRemote(preloadOptions: Array<PreloadRemoteArgs>): Promise<void>;
  initShareScopeMap(scopeName: string, shareScope: ShareScopeMap[string], extraOptions?: {
    hostShareScopeMap?: ShareScopeMap;
  }): void;
  formatOptions(globalOptions: Options, userOptions: UserOptions): Options;
  registerPlugins(plugins: UserOptions['plugins']): void;
  registerRemotes(remotes: Remote[], options?: {
    force?: boolean;
  }): void;
  registerShared(shared: UserOptions['shared']): void;
}
//#endregion
export { ModuleFederation };
//# sourceMappingURL=core.d.ts.map
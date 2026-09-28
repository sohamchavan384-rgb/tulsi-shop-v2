import { CreateLinkHookReturnDom, CreateScriptHookReturn, GlobalModuleInfo, Manifest, Module, ModuleInfo, RemoteEntryType, RemoteWithEntry, RemoteWithVersion, TreeShakingStatus } from "@module-federation/sdk";

//#region ../runtime-core/dist/utils/hooks/syncHook.d.ts
//#region src/utils/hooks/syncHook.d.ts
type Callback<T, K> = (...args: ArgsType<T>) => K;
type ArgsType<T> = T extends Array<any> ? T : Array<any>;
declare class SyncHook<T, K> {
  type: string;
  listeners: Set<Callback<T, K>>;
  constructor(type?: string);
  on(fn: Callback<T, K>): void;
  once(fn: Callback<T, K>): void;
  emit(...data: ArgsType<T>): void | K | Promise<any>;
  remove(fn: Callback<T, K>): void;
  removeAll(): void;
} //#endregion
//#endregion
//#region ../runtime-core/dist/utils/hooks/asyncHook.d.ts
//#region src/utils/hooks/asyncHook.d.ts
type CallbackReturnType$1 = void | false | Promise<void | false>;
declare class AsyncHook<T, ExternalEmitReturnType = CallbackReturnType$1> extends SyncHook<T, ExternalEmitReturnType> {
  emit(...data: ArgsType<T>): Promise<void | false | ExternalEmitReturnType>;
} //#endregion
//#endregion
//#region ../runtime-core/dist/utils/hooks/syncWaterfallHook.d.ts
//#region src/utils/hooks/syncWaterfallHook.d.ts
declare class SyncWaterfallHook<T extends Record<string, any>> extends SyncHook<[T], T | void> {
  onerror: (errMsg: string | Error | unknown) => void;
  constructor(type: string);
  emit(data: T): T;
} //#endregion
//#endregion
//#region ../runtime-core/dist/utils/hooks/asyncWaterfallHooks.d.ts
//#region src/utils/hooks/asyncWaterfallHooks.d.ts
type CallbackReturnType<T> = T | void | Promise<T | void>;
declare class AsyncWaterfallHook<T extends object> extends SyncHook<[T], CallbackReturnType<T>> {
  onerror: (errMsg: string | Error | unknown) => void;
  constructor(type: string);
  emit(data: T): Promise<T>;
} //#endregion
//#endregion
//#region ../runtime-core/dist/utils/hooks/pluginSystem.d.ts
//#region src/utils/hooks/pluginSystem.d.ts
type Plugin<T extends Record<string, any>> = { [k in keyof T]?: Parameters<T[k]['on']>[0] } & {
  name: string;
  version?: string;
};
declare class PluginSystem<T extends Record<string, any>> {
  lifecycle: T;
  lifecycleKeys: Array<keyof T>;
  registerPlugins: Record<string, Plugin<T>>;
  constructor(lifecycle: T);
  applyPlugin(plugin: Plugin<T>): void;
  removePlugin(pluginName: string): void;
} //#endregion
//#endregion
//#region ../runtime-core/dist/type/config.d.ts
//#region src/type/config.d.ts
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;
interface RemoteInfoCommon {
  alias?: string;
  shareScope?: string | string[];
  type?: RemoteEntryType;
  entryGlobalName?: string;
}
type Remote = (RemoteWithEntry | RemoteWithVersion) & RemoteInfoCommon;
type LoadShareExtraOptions = {
  from?: CallFrom;
  customShareInfo?: Partial<Shared>;
  resolver?: (sharedOptions: ShareInfos[string]) => Shared;
  context?: SharedLoadContext;
};
type SharedLoadTrigger = CallFrom | 'container-init';
interface SharedLoadContext {
  trigger?: SharedLoadTrigger;
  moduleId?: string | number;
  chunkId?: string | number;
}
interface RemoteInfo {
  alias?: string;
  name: string;
  version?: string;
  buildVersion?: string;
  entry: string;
  type: RemoteEntryType;
  entryGlobalName: string;
  shareScope: string | string[];
}
interface SharedConfig {
  singleton?: boolean;
  requiredVersion: false | string;
  eager?: boolean;
  strictVersion?: boolean;
  layer?: string | null;
}
type TreeShakingArgs = {
  usedExports?: string[];
  get?: SharedGetter;
  lib?: () => Module;
  status?: TreeShakingStatus;
  mode?: 'server-calc' | 'runtime-infer';
  loading?: null | Promise<any>;
  loaded?: boolean;
  useIn?: Array<string>;
};
type SharedBaseArgs = {
  version?: string;
  shareConfig?: SharedConfig;
  scope?: string | Array<string>;
  deps?: Array<string>;
  strategy?: 'version-first' | 'loaded-first';
  loaded?: boolean;
  treeShaking?: TreeShakingArgs;
};
type SharedGetter = (() => () => Module) | (() => Promise<() => Module>);
type ShareArgs = (SharedBaseArgs & {
  get: SharedGetter;
}) | (SharedBaseArgs & {
  lib: () => Module;
}) | SharedBaseArgs;
type ShareStrategy = 'version-first' | 'loaded-first';
type Shared = {
  version: string;
  get: SharedGetter;
  shareConfig: SharedConfig;
  scope: Array<string>;
  useIn: Array<string>;
  from: string;
  deps: Array<string>;
  lib?: () => Module;
  loaded?: boolean;
  loading?: null | Promise<any>;
  eager?: boolean;
  /**
   * @deprecated set in initOptions.shareStrategy instead
   */
  strategy: ShareStrategy;
  treeShaking?: TreeShakingArgs;
};
type ShareScopeMap = {
  [scope: string]: {
    [pkgName: string]: {
      [sharedVersion: string]: Shared;
    };
  };
};
type GlobalShareScopeMap = {
  [instanceName: string]: ShareScopeMap;
};
type ShareInfos = {
  [pkgName: string]: Shared[];
};
interface Options {
  id?: string;
  name: string;
  version?: string;
  remotes: Array<Remote>;
  shared: ShareInfos;
  plugins: Array<ModuleFederationRuntimePlugin>;
  inBrowser: boolean;
  shareStrategy?: ShareStrategy;
}
type UserOptions = Omit<Optional<Options, 'plugins'>, 'shared' | 'inBrowser'> & {
  shared?: {
    [pkgName: string]: ShareArgs | ShareArgs[];
  };
};
type RemoteEntryInitOptions = {
  version: string;
  shareScopeMap?: ShareScopeMap;
  shareScopeKeys: string | string[];
};
type InitTokens = Record<string, Record<string, any>>;
type InitScope = InitTokens[];
type CallFrom = 'build' | 'runtime';
type RemoteEntryExports = {
  get: (id: string) => () => Promise<Module>;
  init: (shareScope: ShareScopeMap[string], initScope?: InitScope, remoteEntryInitOPtions?: RemoteEntryInitOptions) => void | Promise<void>;
}; //#endregion
//#endregion
//#region ../runtime-core/dist/type/preload.d.ts
//#region src/type/preload.d.ts
type depsPreloadArg = Omit<PreloadRemoteArgs, 'depsRemote'>;
interface PreloadRemoteArgs {
  nameOrAlias: string;
  exposes?: Array<string>;
  resourceCategory?: 'all' | 'sync';
  share?: boolean;
  depsRemote?: boolean | Array<depsPreloadArg>;
  filter?: (assetUrl: string) => boolean;
  /**
   * Record preloaded JS and CSS URLs to skip duplicate resource loading.
   * @default true
   */
  recordPreloadedAssets?: boolean;
}
type PreloadConfig = PreloadRemoteArgs;
type PreloadOptions = Array<{
  remote: Remote;
  preloadConfig: PreloadConfig;
}>;
type ResourceLoadInitiator = 'loadRemote' | 'preloadRemote' | 'loadShare';
type ResourceLoadType = 'manifest' | 'remoteEntry' | 'js' | 'css';
interface ResourceLoadContext$1 {
  initiator: ResourceLoadInitiator;
  id: string;
  resourceType: ResourceLoadType;
  url?: string;
  expose?: string;
}
type PreloadAssetStatus = 'success' | 'error' | 'timeout' | 'cached';
interface PreloadAssetResult {
  url: string;
  status: PreloadAssetStatus;
  resourceType: ResourceLoadType;
  initiator: ResourceLoadInitiator;
  id: string;
  error?: unknown;
}
interface PreloadRemoteResult {
  remote: Remote;
  remoteInfo: RemoteInfo;
  preloadConfig: PreloadConfig;
  id: string;
  results: PreloadAssetResult[];
}
type EntryAssets = {
  name: string;
  url: string;
  moduleInfo: RemoteInfo;
};
interface PreloadAssets {
  cssAssets: Array<string>;
  jsAssetsWithoutEntry: Array<string>;
  entryAssets: Array<EntryAssets>;
} //#endregion
//#endregion
//#region ../runtime-core/dist/remote/index.d.ts
//#region src/remote/index.d.ts
interface LoadRemoteMatch {
  id: string;
  pkgNameOrAlias: string;
  expose: string;
  remote: Remote;
  options: Options;
  origin: ModuleFederation;
  remoteInfo: RemoteInfo;
  remoteSnapshot?: ModuleInfo;
}
declare class RemoteHandler {
  host: ModuleFederation;
  idToRemoteMap: Record<string, {
    name: string;
    expose: string;
  }>;
  hooks: PluginSystem<{
    beforeRegisterRemote: SyncWaterfallHook<{
      remote: Remote;
      origin: ModuleFederation;
    }>;
    registerRemote: SyncWaterfallHook<{
      remote: Remote;
      origin: ModuleFederation;
    }>;
    beforeRequest: AsyncWaterfallHook<{
      id: string;
      options: Options;
      origin: ModuleFederation;
    }>;
    afterMatchRemote: AsyncHook<[{
      id: string;
      options: Options;
      remote?: Remote;
      expose?: string;
      remoteInfo?: RemoteInfo;
      error?: unknown;
      origin: ModuleFederation;
    }], void>;
    onLoad: AsyncHook<[{
      id: string;
      expose: string;
      pkgNameOrAlias: string;
      remote: Remote;
      options: ModuleOptions;
      origin: ModuleFederation;
      exposeModule: any;
      exposeModuleFactory: any;
      moduleInstance: Module$1;
    }], unknown>;
    afterLoadRemote: AsyncHook<[{
      id: string;
      expose?: string;
      remote?: RemoteInfo;
      options?: {
        loadFactory?: boolean;
        from?: CallFrom;
      };
      error?: unknown;
      recovered?: boolean;
      origin: ModuleFederation;
    }], void>;
    handlePreloadModule: SyncHook<[{
      id: string;
      name: string;
      remote: Remote;
      remoteSnapshot: ModuleInfo;
      preloadConfig: PreloadRemoteArgs;
      origin: ModuleFederation;
    }], void>;
    errorLoadRemote: AsyncHook<[{
      id: string;
      error: unknown;
      options?: any;
      from: CallFrom;
      lifecycle: "beforeRequest" | "beforeLoadShare" | "afterResolve" | "onLoad";
      remote?: RemoteInfo;
      expose?: string;
      origin: ModuleFederation;
    }], unknown>;
    beforePreloadRemote: AsyncHook<[{
      preloadOps: Array<PreloadRemoteArgs>;
      options: Options;
      origin: ModuleFederation;
    }], false | void | Promise<false | void>>;
    generatePreloadAssets: AsyncHook<[{
      origin: ModuleFederation;
      preloadOptions: PreloadOptions[number];
      remote: Remote;
      remoteInfo: RemoteInfo;
      remoteSnapshot: ModuleInfo;
      globalSnapshot: GlobalModuleInfo;
    }], Promise<PreloadAssets>>;
    afterPreloadRemote: AsyncHook<[{
      preloadOps: Array<PreloadRemoteArgs>;
      options: Options;
      origin: ModuleFederation;
      results: PreloadRemoteResult[];
      error?: unknown;
    }], false | void | Promise<false | void>>;
    loadEntry: AsyncHook<[{
      origin: ModuleFederation;
      loaderHook: ModuleFederation["loaderHook"];
      remoteInfo: RemoteInfo;
      remoteEntryExports?: RemoteEntryExports;
      resourceContext?: ResourceLoadContext;
    }], void | RemoteEntryExports | Promise<void | RemoteEntryExports>>;
  }>;
  constructor(host: ModuleFederation);
  formatAndRegisterRemote(globalOptions: Options, userOptions: UserOptions): Remote[];
  setIdToRemoteMap(id: string, remoteMatchInfo: LoadRemoteMatch): void;
  loadRemote<T>(id: string, options?: {
    loadFactory?: boolean;
    from: CallFrom;
  }): Promise<T | null>;
  preloadRemote(preloadOptions: Array<PreloadRemoteArgs>): Promise<void>;
  registerRemotes(remotes: Remote[], options?: {
    force?: boolean;
  }): void;
  initRawContainer(name: string, url: string, container: RemoteEntryExports): Module$1;
  getRemoteModuleAndOptions(options: {
    id: string;
  }): Promise<{
    module: Module$1;
    moduleOptions: ModuleOptions;
    remoteMatchInfo: LoadRemoteMatch;
  }>;
  registerRemote(remote: Remote, targetRemotes: Remote[], options?: {
    force?: boolean;
  }): void;
  private removeRemote;
} //#endregion
//#endregion
//#region ../runtime-core/dist/shared/index.d.ts
//#region src/shared/index.d.ts
declare class SharedHandler {
  host: ModuleFederation;
  shareScopeMap: ShareScopeMap;
  hooks: PluginSystem<{
    beforeRegisterShare: SyncWaterfallHook<{
      pkgName: string;
      shared: Shared;
      origin: ModuleFederation;
    }>;
    afterRegisterShare: SyncHook<[{
      pkgName: string;
      scope: string;
      shared: Shared;
      previousShared?: Shared;
      registeredShared?: Shared;
      shareScopeMap: ShareScopeMap;
      trigger: SharedLoadTrigger;
      origin: ModuleFederation;
    }], void>;
    afterResolve: AsyncWaterfallHook<LoadRemoteMatch>;
    beforeLoadShare: AsyncWaterfallHook<{
      pkgName: string;
      shareInfo?: Shared;
      shared: Options["shared"];
      origin: ModuleFederation;
      loadContext?: SharedLoadContext;
    }>;
    loadShare: AsyncHook<[ModuleFederation, string, ShareInfos], false | void | Promise<false | void>>;
    afterLoadShare: SyncHook<[{
      pkgName: string;
      shareInfo?: Partial<Shared>;
      selectedShared?: Partial<Shared>;
      shared: Options["shared"];
      shareScopeMap: ShareScopeMap;
      lifecycle: "loadShare" | "loadShareSync";
      loadContext?: SharedLoadContext;
      origin: ModuleFederation;
    }], void>;
    errorLoadShare: SyncHook<[{
      pkgName: string;
      shareInfo?: Partial<Shared>;
      shared: Options["shared"];
      shareScopeMap: ShareScopeMap;
      lifecycle: "loadShare" | "loadShareSync";
      origin: ModuleFederation;
      error?: unknown;
      recovered?: boolean;
      loadContext?: SharedLoadContext;
    }], void>;
    resolveShare: SyncWaterfallHook<{
      shareScopeMap: ShareScopeMap;
      scope: string;
      pkgName: string;
      version: string;
      shareInfo: Shared;
      GlobalFederation: Federation;
      resolver: () => {
        shared: Shared;
        useTreesShaking: boolean;
      } | undefined;
      loadContext?: SharedLoadContext;
    }>;
    initContainerShareScopeMap: SyncWaterfallHook<{
      shareScope: ShareScopeMap[string];
      options: Options;
      origin: ModuleFederation;
      scopeName: string;
      hostShareScopeMap?: ShareScopeMap;
    }>;
  }>;
  initTokens: InitTokens;
  constructor(host: ModuleFederation);
  private emitAfterRegisterShare;
  private emitAfterLoadShare;
  private emitErrorLoadShare;
  registerShared(globalOptions: Options, userOptions: UserOptions): {
    newShareInfos: ShareInfos;
    allShareInfos: {
      [pkgName: string]: Shared[];
    };
  };
  loadShare<T>(pkgName: string, extraOptions?: LoadShareExtraOptions): Promise<false | (() => T | undefined)>;
  /**
   * This function initializes the sharing sequence (executed only once per share scope).
   * It accepts one argument, the name of the share scope.
   * If the share scope does not exist, it creates one.
   */
  initializeSharing(shareScopeName?: string, extraOptions?: {
    initScope?: InitScope;
    from?: CallFrom;
    strategy?: ShareStrategy;
    context?: SharedLoadContext;
  }): Array<Promise<void>>;
  loadShareSync<T>(pkgName: string, extraOptions?: LoadShareExtraOptions): () => T | never;
  initShareScopeMap(scopeName: string, shareScope: ShareScopeMap[string], extraOptions?: {
    hostShareScopeMap?: ShareScopeMap;
  }): void;
  private setShared;
  private _setGlobalShareScopeMap;
} //#endregion
//#endregion
//#region ../runtime-core/dist/type/plugin.d.ts
//#region src/type/plugin.d.ts
type CoreLifeCycle = ModuleFederation['hooks']['lifecycle'];
type CoreLifeCyclePartial = Partial<{ [k in keyof CoreLifeCycle]: Parameters<CoreLifeCycle[k]['on']>[0] }>;
type SnapshotLifeCycle = SnapshotHandler['hooks']['lifecycle'];
type SnapshotLifeCycleCyclePartial = Partial<{ [k in keyof SnapshotLifeCycle]: Parameters<SnapshotLifeCycle[k]['on']>[0] }>;
type ModuleLifeCycle = Module$1['host']['loaderHook']['lifecycle'];
type ModuleLifeCycleCyclePartial = Partial<{ [k in keyof ModuleLifeCycle]: Parameters<ModuleLifeCycle[k]['on']>[0] }>;
type ModuleBridgeLifeCycle = Module$1['host']['bridgeHook']['lifecycle'];
type ModuleBridgeLifeCycleCyclePartial = Partial<{ [k in keyof ModuleBridgeLifeCycle]: Parameters<ModuleBridgeLifeCycle[k]['on']>[0] }>;
type SharedLifeCycle = SharedHandler['hooks']['lifecycle'];
type SharedLifeCycleCyclePartial = Partial<{ [k in keyof SharedLifeCycle]: Parameters<SharedLifeCycle[k]['on']>[0] }>;
type RemoteLifeCycle = RemoteHandler['hooks']['lifecycle'];
type RemoteLifeCycleCyclePartial = Partial<{ [k in keyof RemoteLifeCycle]: Parameters<RemoteLifeCycle[k]['on']>[0] }>;
type RuntimePluginHooks = CoreLifeCyclePartial & SnapshotLifeCycleCyclePartial & SharedLifeCycleCyclePartial & RemoteLifeCycleCyclePartial & ModuleLifeCycleCyclePartial & ModuleBridgeLifeCycleCyclePartial;
type ModuleFederationRuntimePlugin = RuntimePluginHooks & {
  name: string;
  version?: string;
  apply?: (instance: ModuleFederation) => void | RuntimePluginHooks;
}; //#endregion
//#endregion
//#region ../runtime-core/dist/global.d.ts
//#region src/global.d.ts
interface Federation {
  __GLOBAL_PLUGIN__: Array<ModuleFederationRuntimePlugin>;
  __DEBUG_CONSTRUCTOR_VERSION__?: string;
  moduleInfo: GlobalModuleInfo;
  __DEBUG_CONSTRUCTOR__?: typeof ModuleFederation;
  __INSTANCES__: Array<ModuleFederation>;
  __SHARE__: GlobalShareScopeMap;
  __MANIFEST_LOADING__: Record<string, Promise<ModuleInfo>>;
  __PRELOADED_MAP__: Map<string, boolean>;
  __PRELOADED_ASSETS__: Set<string>;
}
declare global {
  var __FEDERATION__: Federation, __VMOK__: Federation, __GLOBAL_LOADING_REMOTE_ENTRY__: Record<string, undefined | Promise<RemoteEntryExports | void>>;
}
declare const getGlobalSnapshot: () => GlobalModuleInfo;
//#endregion
//#region ../runtime-core/dist/plugins/snapshot/SnapshotHandler.d.ts
//#region src/plugins/snapshot/SnapshotHandler.d.ts
declare class SnapshotHandler {
  loadingHostSnapshot: Promise<GlobalModuleInfo | void> | null;
  HostInstance: ModuleFederation;
  manifestCache: Map<string, Manifest>;
  hooks: PluginSystem<{
    beforeLoadRemoteSnapshot: AsyncHook<[{
      options: Options;
      moduleInfo: Remote;
      origin: ModuleFederation;
    }], void>;
    loadSnapshot: AsyncWaterfallHook<{
      options: Options;
      moduleInfo: Remote;
      hostGlobalSnapshot: GlobalModuleInfo[string] | undefined;
      globalSnapshot: ReturnType<typeof getGlobalSnapshot>;
      remoteSnapshot?: GlobalModuleInfo[string] | undefined;
    }>;
    loadRemoteSnapshot: AsyncWaterfallHook<{
      options: Options;
      moduleInfo: Remote;
      manifestJson?: Manifest;
      manifestUrl?: string;
      remoteSnapshot: ModuleInfo;
      from: "global" | "manifest";
    }>;
    afterLoadSnapshot: AsyncWaterfallHook<{
      id?: string;
      host: ModuleFederation;
      options: Options;
      moduleInfo: Remote;
      remoteSnapshot: ModuleInfo;
    }>;
    beforeLoadManifest: AsyncHook<[{
      manifestUrl: string;
      moduleInfo: Remote;
      resourceOptions?: {
        initiator: ResourceLoadInitiator;
        id: string;
      };
      origin: ModuleFederation;
    }], void>;
    afterLoadManifest: AsyncHook<[{
      manifestUrl: string;
      moduleInfo: Remote;
      resourceOptions?: {
        initiator: ResourceLoadInitiator;
        id: string;
      };
      manifestJson?: Manifest;
      response?: Response;
      error?: unknown;
      cached?: boolean;
      recovered?: boolean;
      origin: ModuleFederation;
    }], void>;
  }>;
  loaderHook: ModuleFederation['loaderHook'];
  manifestLoading: Record<string, Promise<ModuleInfo>>;
  constructor(HostInstance: ModuleFederation);
  loadRemoteSnapshotInfo({
    moduleInfo,
    id,
    initiator
  }: {
    moduleInfo: Remote;
    id?: string;
    initiator?: ResourceLoadInitiator;
  }): Promise<{
    remoteSnapshot: ModuleInfo;
    globalSnapshot: GlobalModuleInfo;
  }> | never;
  getGlobalRemoteInfo(moduleInfo: Remote): {
    hostGlobalSnapshot: ModuleInfo | undefined;
    globalSnapshot: ReturnType<typeof getGlobalSnapshot>;
    remoteSnapshot: GlobalModuleInfo[string] | undefined;
  };
  private getManifestJson;
  private loadManifestSnapshot;
} //#endregion
//#endregion
//#region ../runtime-core/dist/utils/load.d.ts
//#region src/utils/load.d.ts
declare function getRemoteEntry(params: {
  origin: ModuleFederation;
  remoteInfo: RemoteInfo;
  remoteEntryExports?: RemoteEntryExports | undefined;
  getEntryUrl?: (url: string) => string;
  _inErrorHandling?: boolean;
  resourceContext?: ResourceLoadContext$1;
}): Promise<RemoteEntryExports | false | void>;
//#endregion
//#region ../runtime-core/dist/core.d.ts
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
      resourceContext?: ResourceLoadContext$1;
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
      resourceContext?: ResourceLoadContext$1;
    }], CreateLinkHookReturnDom>;
    fetch: AsyncHook<[string, RequestInit, (RemoteInfo | undefined)?, (ResourceLoadContext$1 | undefined)?], false | void | Promise<Response>>;
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
      resourceContext?: ResourceLoadContext$1;
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
} //#endregion
//#endregion
//#region ../runtime-core/dist/module/index.d.ts
//#region src/module/index.d.ts
type ModuleOptions = ConstructorParameters<typeof Module$1>[0];
type RemoteModuleFactory = () => unknown | Promise<unknown>;
declare class Module$1 {
  remoteInfo: RemoteInfo;
  inited: boolean;
  initing: boolean;
  initPromise?: Promise<void>;
  remoteEntryExports?: RemoteEntryExports;
  lib: RemoteEntryExports | undefined;
  host: ModuleFederation;
  constructor({
    remoteInfo,
    host
  }: {
    remoteInfo: RemoteInfo;
    host: ModuleFederation;
  });
  getEntry(expose?: string, resourceContext?: ResourceLoadContext$1): Promise<RemoteEntryExports>;
  init(id?: string, remoteSnapshot?: ModuleInfo, rawInitScope?: InitScope, expose?: string, resourceContext?: ResourceLoadContext$1): Promise<RemoteEntryExports>;
  get(id: string, expose: string, options?: {
    loadFactory?: boolean;
  }, remoteSnapshot?: ModuleInfo): Promise<unknown>;
  private wraperFactory;
} //#endregion
//#endregion
//#region src/runtime-plugins/dynamic-remote-type-hints-plugin.d.ts
declare function dynamicRemoteTypeHintsPlugin(): ModuleFederationRuntimePlugin;
export = dynamicRemoteTypeHintsPlugin;
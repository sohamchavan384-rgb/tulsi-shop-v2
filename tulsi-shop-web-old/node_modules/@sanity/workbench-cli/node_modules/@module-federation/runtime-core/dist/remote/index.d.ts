import { Module as Module$1, ModuleOptions } from "../module/index.js";
import { SyncHook } from "../utils/hooks/syncHook.js";
import { AsyncHook } from "../utils/hooks/asyncHook.js";
import { SyncWaterfallHook } from "../utils/hooks/syncWaterfallHook.js";
import { AsyncWaterfallHook } from "../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../utils/hooks/pluginSystem.js";
import { ModuleFederation } from "../core.js";
import { CallFrom, Options, Remote, RemoteEntryExports, RemoteInfo, UserOptions } from "../type/config.js";
import { PreloadAssets, PreloadOptions, PreloadRemoteArgs, PreloadRemoteResult } from "../type/preload.js";
import { GlobalModuleInfo, ModuleInfo } from "@module-federation/sdk";

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
}
//#endregion
export { LoadRemoteMatch, RemoteHandler };
//# sourceMappingURL=index.d.ts.map
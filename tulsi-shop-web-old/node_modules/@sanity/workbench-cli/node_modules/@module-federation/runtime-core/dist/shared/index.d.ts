import { SyncHook } from "../utils/hooks/syncHook.js";
import { AsyncHook } from "../utils/hooks/asyncHook.js";
import { SyncWaterfallHook } from "../utils/hooks/syncWaterfallHook.js";
import { AsyncWaterfallHook } from "../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../utils/hooks/pluginSystem.js";
import { Federation } from "../global.js";
import { LoadRemoteMatch } from "../remote/index.js";
import { ModuleFederation } from "../core.js";
import { CallFrom, InitScope, InitTokens, LoadShareExtraOptions, Options, ShareInfos, ShareScopeMap, ShareStrategy, Shared, SharedLoadContext, SharedLoadTrigger, UserOptions } from "../type/config.js";
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
}
//#endregion
export { SharedHandler };
//# sourceMappingURL=index.d.ts.map
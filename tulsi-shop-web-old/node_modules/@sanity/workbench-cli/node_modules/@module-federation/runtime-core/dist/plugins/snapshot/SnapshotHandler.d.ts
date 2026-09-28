import { AsyncHook } from "../../utils/hooks/asyncHook.js";
import { AsyncWaterfallHook } from "../../utils/hooks/asyncWaterfallHooks.js";
import { PluginSystem } from "../../utils/hooks/pluginSystem.js";
import { getGlobalSnapshot } from "../../global.js";
import { ModuleFederation } from "../../core.js";
import { Options, Remote } from "../../type/config.js";
import { ResourceLoadInitiator } from "../../type/preload.js";
import { GlobalModuleInfo, Manifest, ModuleInfo } from "@module-federation/sdk";

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
}
//#endregion
export { SnapshotHandler };
//# sourceMappingURL=SnapshotHandler.d.ts.map
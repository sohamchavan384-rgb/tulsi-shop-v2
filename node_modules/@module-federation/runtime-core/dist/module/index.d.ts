import { ModuleFederation } from "../core.js";
import { InitScope, RemoteEntryExports, RemoteInfo } from "../type/config.js";
import { ResourceLoadContext } from "../type/preload.js";
import { ModuleInfo } from "@module-federation/sdk";

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
  getEntry(expose?: string, resourceContext?: ResourceLoadContext): Promise<RemoteEntryExports>;
  init(id?: string, remoteSnapshot?: ModuleInfo, rawInitScope?: InitScope, expose?: string, resourceContext?: ResourceLoadContext): Promise<RemoteEntryExports>;
  get(id: string, expose: string, options?: {
    loadFactory?: boolean;
  }, remoteSnapshot?: ModuleInfo): Promise<unknown>;
  private wraperFactory;
}
//#endregion
export { Module$1 as Module, ModuleOptions, RemoteModuleFactory };
//# sourceMappingURL=index.d.ts.map
import { ModuleFederation } from "../core.js";
import { RemoteInfo } from "../type/config.js";
import { PreloadAssetResult, PreloadAssets, ResourceLoadContext } from "../type/preload.js";
//#region src/utils/preload.d.ts
declare function preloadAssets(remoteInfo: RemoteInfo, host: ModuleFederation, assets: PreloadAssets, useLinkPreload?: boolean, baseContext?: Omit<ResourceLoadContext, 'resourceType'>, recordPreloadedAssets?: boolean): Promise<PreloadAssetResult[]>;
//#endregion
export { preloadAssets };
//# sourceMappingURL=preload.d.ts.map
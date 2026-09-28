import PQueue from 'p-queue';
import type { AssetDocument, AssetMap, SanityClientLike } from './types.js';
declare const ACTION_REMOVE: "remove";
declare const ACTION_REWRITE: "rewrite";
type AssetAction = typeof ACTION_REMOVE | typeof ACTION_REWRITE;
interface AssetHandlerOptions {
    client: SanityClientLike;
    tmpDir: string;
    prefix?: string;
    concurrency?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    queue?: PQueue;
    strictAssetVerification?: boolean;
}
interface AssetRequestOptions {
    url: string;
    headers: Record<string, string>;
}
export declare class AssetHandler {
    client: SanityClientLike;
    tmpDir: string;
    assetDirsCreated: boolean;
    downloading: string[];
    assetsSeen: Map<string, string>;
    assetMap: AssetMap;
    filesWritten: number;
    queueSize: number;
    maxRetries: number;
    retryDelayMs: number | undefined;
    queue: PQueue;
    strictAssetVerification: boolean;
    rejectedError: Error | null;
    reject: (err: Error) => void;
    constructor(options: AssetHandlerOptions);
    clear(): void;
    finish(): Promise<AssetMap>;
    rewriteAssets: import("stream").Transform;
    stripAssets: import("stream").Transform;
    skipAssets: import("stream").Transform;
    noop: import("stream").Transform;
    queueAssetDownload(assetDoc: AssetDocument, dstPath: string): void;
    maybeCreateAssetDirs(): void;
    getAssetRequestOptions(assetDoc: AssetDocument): AssetRequestOptions;
    downloadAsset(assetDoc: AssetDocument, dstPath: string): Promise<boolean>;
    findAndModify: (item: unknown, action: AssetAction) => unknown;
}
export {};
//# sourceMappingURL=AssetHandler.d.ts.map
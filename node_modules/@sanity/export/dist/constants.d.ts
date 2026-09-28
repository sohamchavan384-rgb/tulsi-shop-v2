/**
 * How many retries to attempt when retrieving the document stream.
 * User overridable as `options.maxRetries`.
 *
 * Note: Only for initial connection - if download fails while streaming, we cannot easily resume.
 * @internal
 */
export declare const DOCUMENT_STREAM_MAX_RETRIES: number;
/**
 * How many retries to attempt when downloading an asset.
 * User overridable as `options.maxAssetRetries`.
 * @internal
 */
export declare const ASSET_DOWNLOAD_MAX_RETRIES: number;
/**
 * Default delay between retries when retrieving assets or document stream.
 * User overridable as `options.retryDelayMs`.
 * @internal
 */
export declare const DEFAULT_RETRY_DELAY: number;
/**
 * How many concurrent asset downloads to allow.
 * User overridable as `options.assetConcurrency`.
 * @internal
 */
export declare const ASSET_DOWNLOAD_CONCURRENCY: number;
/**
 * How frequently we will `debug` log while streaming the documents.
 * @internal
 */
export declare const DOCUMENT_STREAM_DEBUG_INTERVAL: number;
/**
 * How long to wait before timing out the read of a request due to inactivity.
 * User overridable as `options.readTimeout`.
 * @internal
 */
export declare const REQUEST_READ_TIMEOUT: number;
/**
 * What mode to use when exporting documents.
 * stream: Export all documents in the dataset in one request, this will be consistent but might be slow on large datasets.
 * cursor: Export documents using a cursor, this might lead to inconsistent results if a mutation is performed while exporting.
 */
export declare const MODE_STREAM: "stream";
export declare const MODE_CURSOR: "cursor";
//# sourceMappingURL=constants.d.ts.map
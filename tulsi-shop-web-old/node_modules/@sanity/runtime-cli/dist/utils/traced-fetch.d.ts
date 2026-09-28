import type { Logger } from './logger.js';
/**
 * Configuration options for traced fetch
 */
export interface TracedFetchOptions {
    /** Whether to log request headers. Default: true */
    logRequestHeaders?: boolean;
    /** Whether to log response headers. Default: true */
    logResponseHeaders?: boolean;
    /** Whether to log request body. Default: true */
    logRequestBody?: boolean;
    /** Whether to log response body. Default: true */
    logResponseBody?: boolean;
    /** Maximum length for body preview. Default: 500 */
    maxBodyLength?: number;
    /** Headers to redact (case-insensitive). Default: ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token', 'proxy-authorization'] */
    redactedHeaders?: string[];
}
/**
 * Creates a traced fetch function with HTTP request/response introspection.
 * Logs HTTP details to the provided logger when set to TRACE log level.
 * Includes request timing, headers, and optional body previews.
 * Headers containing sensitive data are redacted by default.
 * @param logger - Logger instance from Logger() factory
 * @param options - Configuration options for logging behavior
 * @returns A fetch-compatible function with tracing capabilities
 *
 * @example
 * ```typescript
 * const logger = Logger(console.log, {trace: true})
 * const tracedFetch = createTracedFetch(logger)
 * const response = await tracedFetch('https://api.example.com/data')
 * ```
 */
export declare function createTracedFetch(logger: Logger, options?: TracedFetchOptions): typeof fetch;

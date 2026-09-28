import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { env } from 'node:process';
import { styleText } from './style-text.js';
let defaultMaxLength = env.SANITY_TRACE_MAX_LENGTH
    ? Number.parseInt(env.SANITY_TRACE_MAX_LENGTH, 10)
    : 500;
if (Number.isNaN(defaultMaxLength))
    defaultMaxLength = 500;
const DEFAULT_OPTIONS = {
    logRequestHeaders: true,
    logResponseHeaders: true,
    logRequestBody: true,
    logResponseBody: true,
    maxBodyLength: defaultMaxLength,
    redactedHeaders: [
        'authorization',
        'cookie',
        'set-cookie',
        'x-api-key',
        'x-auth-token',
        'proxy-authorization',
    ],
};
/**
 * Content types that are safe to log as text
 */
const SAFE_CONTENT_TYPES = [
    'application/json',
    'application/xml',
    'application/x-www-form-urlencoded',
    'text/',
];
/**
 * Check if content type is safe to log
 */
function isSafeContentType(contentType) {
    const lower = contentType.toLowerCase();
    return SAFE_CONTENT_TYPES.some((safe) => lower.startsWith(safe));
}
/**
 * Redact sensitive headers
 */
function redactHeaders(headers, redactedKeys) {
    if (!headers)
        return {};
    const result = {};
    const redactedLower = redactedKeys.map((k) => k.toLowerCase());
    // Handle Headers object
    if (headers instanceof Headers) {
        headers.forEach((value, key) => {
            result[key] = redactedLower.includes(key.toLowerCase()) ? '[REDACTED]' : value;
        });
    }
    // Handle array of tuples
    else if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
            result[key] = redactedLower.includes(key.toLowerCase()) ? '[REDACTED]' : value;
        }
    }
    // Handle plain object
    else {
        for (const [key, value] of Object.entries(headers)) {
            result[key] = redactedLower.includes(key.toLowerCase()) ? '[REDACTED]' : value;
        }
    }
    return result;
}
/**
 * Create a preview of body content
 */
function createBodyPreview(body, maxLength, contentType) {
    if (body === null) {
        return '[empty]';
    }
    // Handle string bodies
    if (typeof body === 'string') {
        if (!contentType || isSafeContentType(contentType)) {
            if (body.length <= maxLength) {
                return body;
            }
            return `${body.slice(0, maxLength)}... [truncated]`;
        }
        return `[non-text content, ${body.length} chars]`;
    }
    // Handle Buffer
    if (Buffer.isBuffer(body)) {
        if (contentType && isSafeContentType(contentType)) {
            const text = body.toString('utf8');
            if (text.length <= maxLength) {
                return text;
            }
            return `${text.slice(0, maxLength)}... [truncated]`;
        }
        return `[${contentType} binary, ${body.length} bytes]`;
    }
    return '[unknown content type]';
}
/**
 * Extract body from RequestInit if present
 */
async function extractRequestBody(init) {
    if (!init?.body) {
        return { body: null, contentType: null };
    }
    const contentType = init.headers ? new Headers(init.headers).get('content-type') : null;
    // init.body in node can be string, buffer, blob, formdata, url search params or a readable stream, so handle each case.
    if (typeof init.body === 'string') {
        return { body: init.body, contentType };
    }
    if (init.body instanceof FormData) {
        return { body: '[FormData]', contentType };
    }
    if (init.body instanceof URLSearchParams) {
        return { body: init.body.toString(), contentType };
    }
    if (init.body instanceof Blob) {
        return { body: '[FormData]', contentType: contentType || init.body.type };
    }
    if (init.body instanceof ReadableStream) {
        return { body: '[ReadableStream]', contentType };
    }
    if (Buffer.isBuffer(init.body)) {
        return { body: init.body, contentType };
    }
    return { body: '[unknown body type]', contentType };
}
/**
 * Extract body from Response
 */
async function extractResponseBody(response, maxLength) {
    const contentType = response.headers.get('content-type');
    // Don't try to read body for streaming responses (event-stream)
    if (contentType?.includes('text/event-stream')) {
        return '[streaming response]';
    }
    // Clone response to avoid consuming it
    const cloned = response.clone();
    try {
        // Try to read as text
        const text = await cloned.text();
        if (!contentType || isSafeContentType(contentType)) {
            if (text.length <= maxLength) {
                return text;
            }
            return `${text.slice(0, maxLength)}... [truncated]`;
        }
        return `[binary content, ${text.length} bytes]`;
    }
    catch (error) {
        return `[unable to read body: ${error instanceof Error ? error.message : String(error)}]`;
    }
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
export function createTracedFetch(logger, options) {
    const opts = {
        ...DEFAULT_OPTIONS,
        ...options,
    };
    return async (input, init) => {
        if (!logger.isTraceEnabled)
            return fetch(input, init);
        const requestId = randomUUID().slice(0, 3);
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method || 'GET';
        const startTime = performance.now();
        function trace(type, msgTemplate, ...args) {
            const arrow = type === 'req' ? '→' : type === 'res' ? '←' : styleText('red', '✗');
            logger.trace(`${styleText('dim', '[%s]')} ${styleText('dim', `[${new Date().toISOString()}]`)} HTTP ${arrow} ${msgTemplate}`, requestId, ...args);
        }
        // Log request URL
        trace('req', '%s %s', method, url);
        // Log request headers
        if (opts.logRequestHeaders && init?.headers) {
            const redacted = redactHeaders(init.headers, opts.redactedHeaders);
            trace('req', 'Headers: %j', redacted);
        }
        // Log request body
        if (opts.logRequestBody && init?.body) {
            try {
                const { body, contentType } = await extractRequestBody(init);
                const preview = createBodyPreview(body, opts.maxBodyLength, contentType);
                trace('req', 'Body: %s', preview);
            }
            catch (error) {
                trace('err', 'Body: [error reading body: %s]', error instanceof Error ? error.message : String(error));
            }
        }
        try {
            // Make the actual fetch call
            const response = await fetch(input, init);
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            // Log response
            trace('res', '%d %s (%dms)', response.status, response.statusText, duration);
            // Log response headers
            if (opts.logResponseHeaders) {
                const headers = {};
                response.headers.forEach((value, key) => {
                    headers[key] = value;
                });
                trace('res', 'Headers: %j', headers);
            }
            // Log response body
            if (opts.logResponseBody) {
                try {
                    const bodyPreview = await extractResponseBody(response, opts.maxBodyLength);
                    trace('res', 'Body: %s', bodyPreview);
                }
                catch (error) {
                    trace('err', 'Body: [error reading body: %s]', error instanceof Error ? error.message : String(error));
                }
            }
            return response;
        }
        catch (error) {
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            // Log error
            trace('err', '%s %s (%dms) - %s', method, url, duration, error instanceof Error ? error.message : String(error));
            // Re-throw the error
            throw error;
        }
    };
}

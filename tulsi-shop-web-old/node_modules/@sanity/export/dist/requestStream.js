import { getIt } from 'get-it';
import { keepAlive, promise } from 'get-it/middleware';
import { delay } from './util/delay.js';
import { extractFirstError } from './util/extractFirstError.js';
import { tryThrowFriendlyError } from './util/friendlyError.js';
import { DEFAULT_RETRY_DELAY, DOCUMENT_STREAM_MAX_RETRIES, REQUEST_READ_TIMEOUT, } from './constants.js';
import { debug } from './debug.js';
const request = getIt([keepAlive(), promise({ onlyBody: true })]);
const CONNECTION_TIMEOUT = 15 * 1000; // 15 seconds
export async function requestStream(options) {
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : DOCUMENT_STREAM_MAX_RETRIES;
    const readTimeout = options.readTimeout !== undefined ? options.readTimeout : REQUEST_READ_TIMEOUT;
    const retryDelayMs = options.retryDelayMs !== undefined ? options.retryDelayMs : DEFAULT_RETRY_DELAY;
    let error;
    let i = 0;
    do {
        i++;
        try {
            return await request({
                ...options,
                stream: true,
                maxRedirects: 0,
                timeout: { connect: CONNECTION_TIMEOUT, socket: readTimeout },
            });
        }
        catch (err) {
            const firstError = extractFirstError(err);
            error = firstError !== null ? firstError : err;
            if (maxRetries === 0) {
                throw error;
            }
            if (error.response?.statusCode && error.response.statusCode < 500) {
                break;
            }
            if (i < maxRetries) {
                debug('Error, retrying after %d ms: %s', retryDelayMs, error.message);
                await delay(retryDelayMs);
            }
        }
    } while (i < maxRetries);
    await tryThrowFriendlyError(error);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!error) {
        throw new Error(`Export: Failed to fetch ${options.url}: Unknown error`);
    }
    throw new Error(`Export: Failed to fetch ${options.url}: ${error.message}`);
}
//# sourceMappingURL=requestStream.js.map
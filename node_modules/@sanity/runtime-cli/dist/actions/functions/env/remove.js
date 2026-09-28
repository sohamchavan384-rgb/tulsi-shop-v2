import config from '../../../config.js';
import getHeaders from '../../../utils/get-headers.js';
import { createTracedFetch } from '../../../utils/traced-fetch.js';
const { apiUrl } = config;
export async function remove(id, key, auth, logger) {
    const fetchFn = createTracedFetch(logger);
    const response = await fetchFn(`${apiUrl}v2025-07-30/functions/${id}/envvars/${key}`, {
        headers: getHeaders(auth),
        method: 'DELETE',
    });
    const json = response.ok ? undefined : await response.json();
    return {
        ok: response.ok,
        error: response.ok ? null : json?.error?.message,
    };
}

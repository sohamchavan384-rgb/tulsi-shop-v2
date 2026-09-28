import config from '../../../config.js';
import getHeaders from '../../../utils/get-headers.js';
import { createTracedFetch } from '../../../utils/traced-fetch.js';
const { apiUrl } = config;
export async function update(id, key, value, auth, logger) {
    const fetchFn = createTracedFetch(logger);
    const response = await fetchFn(`${apiUrl}v2025-07-30/functions/${id}/envvars/${key}`, {
        body: JSON.stringify({ value }),
        headers: getHeaders(auth),
        method: 'PUT',
    });
    const json = response.ok ? undefined : await response.json();
    return {
        ok: response.ok,
        error: response.ok ? null : json?.error?.message,
    };
}

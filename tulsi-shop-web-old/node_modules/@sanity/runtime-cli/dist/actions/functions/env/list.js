import config from '../../../config.js';
import getHeaders from '../../../utils/get-headers.js';
import { createTracedFetch } from '../../../utils/traced-fetch.js';
const { apiUrl } = config;
export async function list(id, auth, logger) {
    const fetchFn = createTracedFetch(logger);
    const response = await fetchFn(`${apiUrl}v2025-07-30/functions/${id}/envvars`, {
        headers: getHeaders(auth),
        method: 'GET',
    });
    const json = await response.json();
    return {
        ok: response.ok,
        envvars: json.envvars,
        error: response.ok ? null : json?.error?.message,
    };
}

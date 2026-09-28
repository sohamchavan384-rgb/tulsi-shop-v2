import config, { RUNTIME_CLI_USER_AGENT } from '../../config.js';
import getHeaders from '../../utils/get-headers.js';
import { createTracedFetch } from '../../utils/traced-fetch.js';
const { apiUrl } = config;
export const accessApiVersion = 'v2025-07-11';
export const accessApiPath = `${apiUrl}${accessApiVersion}/access`;
/** Create a robot token via the Access API. */
export async function createRobotToken({ auth, resourceType, resourceId, body, logger, }) {
    const fetchFn = createTracedFetch(logger);
    const url = `${accessApiPath}/${resourceType}/${encodeURIComponent(resourceId)}/robots`;
    const response = await fetchFn(url, {
        method: 'POST',
        headers: getHeaders(auth),
        body: JSON.stringify(body),
    });
    const raw = await response.json().catch(() => null);
    const data = (raw && typeof raw === 'object' ? raw : {});
    if (!response.ok) {
        const errMessage = data.message || data.error?.message || response.statusText;
        return { ok: false, error: errMessage, robot: null };
    }
    return { ok: true, error: null, robot: raw };
}
/** Check whether the token's user holds a specific permission on a project or organization. */
export async function checkUserPermission({ auth, resourceType, resourceId, permission, logger, }) {
    const fetchFn = createTracedFetch(logger);
    const url = `${accessApiPath}/${resourceType}/${encodeURIComponent(resourceId)}/user-permissions/me/check?permissions=${encodeURIComponent(permission)}`;
    const response = await fetchFn(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${auth.token}`,
            'User-Agent': RUNTIME_CLI_USER_AGENT,
        },
    });
    const raw = await response.json().catch(() => null);
    const body = (raw && typeof raw === 'object' ? raw : {});
    if (!response.ok) {
        const errMessage = body.message || body.error?.message || response.statusText;
        return { ok: false, error: errMessage, hasPermission: false };
    }
    return {
        ok: true,
        error: null,
        hasPermission: body.data?.[permission] === true,
    };
}

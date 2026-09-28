import { RUNTIME_CLI_USER_AGENT } from '../config.js';
export default function getHeaders({ token, scopeId, scopeType }) {
    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Sanity-Scope-Type': scopeType,
        'X-Sanity-Scope-Id': scopeId,
        'User-Agent': RUNTIME_CLI_USER_AGENT,
    };
}

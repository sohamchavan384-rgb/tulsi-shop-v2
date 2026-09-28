import type { AuthParams } from './types.js';
export default function getHeaders({ token, scopeId, scopeType }: AuthParams): {
    Accept: string;
    'Content-Type': string;
    Authorization: string;
    'X-Sanity-Scope-Type': import("./types.js").ScopeType;
    'X-Sanity-Scope-Id': string;
    'User-Agent': string;
};

import { env as processEnv } from 'node:process';
/**
 * Resolve organization, project, and stack IDs from a prioritized set of sources.
 * Precedence: flags > env > module > config.
 * Derives scopeType/scopeId from the resolved IDs (project > organization).
 *
 * Env vars are read from process.env by default (SANITY_ORGANIZATION_ID,
 * SANITY_PROJECT_ID, SANITY_BLUEPRINT_STACK_ID). Pass `env` explicitly to
 * override, or `null` to skip.
 */
export function resolveIds(sources = {}) {
    const envValues = sources.env !== undefined
        ? sources.env
        : {
            organizationId: processEnv.SANITY_ORGANIZATION_ID,
            projectId: processEnv.SANITY_PROJECT_ID,
            stackId: processEnv.SANITY_BLUEPRINT_STACK_ID,
        };
    const ordered = [
        { source: 'flags', values: sources.flags },
        { source: 'env', values: envValues },
        { source: 'module', values: sources.module },
        { source: 'config', values: sources.config },
    ];
    const result = { sources: {} };
    for (const { source, values } of ordered) {
        if (values === null || values === undefined)
            continue;
        if (!result.organizationId && values.organizationId) {
            result.organizationId = values.organizationId;
            result.sources.organizationId = source;
        }
        if (!result.projectId && values.projectId) {
            result.projectId = values.projectId;
            result.sources.projectId = source;
        }
        if (!result.stackId && values.stackId) {
            result.stackId = values.stackId;
            result.sources.stackId = source;
        }
    }
    // Scope is as specific as possible; project > organization
    if (result.projectId) {
        result.scopeType = 'project';
        result.scopeId = result.projectId;
    }
    else if (result.organizationId) {
        result.scopeType = 'organization';
        result.scopeId = result.organizationId;
    }
    return result;
}

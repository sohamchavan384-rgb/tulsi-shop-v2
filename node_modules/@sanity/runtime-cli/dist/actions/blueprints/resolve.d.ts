import type { ScopeType } from '../../utils/types.js';
/**
 * Source of a resolved config value.
 * - flags: from CLI flags like `--project-id`
 * - env: from the environment - usually CLI var like `SANITY_ORGANIZATION_ID`
 * - module: from the blueprint module - undocumented escape hatch
 * - config: from the config file - .sanity/blueprint.config.json most common
 * - inferred: legacy `ST-<projectId>` stacks from launch
 */
export type ConfigSource = 'flags' | 'env' | 'module' | 'config' | 'inferred';
/** A set of optional IDs from a single source. */
export interface IdValues {
    organizationId?: string;
    projectId?: string;
    stackId?: string;
}
/**
 * Sources to resolve IDs from, in descending priority.
 * Each key maps to a source; the first non-empty value wins.
 *
 * - `env` defaults to reading SANITY_* process.env vars
 * - `module` and `config` accept any object with `{organizationId?, projectId?, stackId?}`
 */
export interface IdSources {
    flags?: IdValues | null;
    env?: IdValues | null;
    module?: IdValues | null;
    config?: IdValues | null;
}
export interface ResolvedIds {
    organizationId?: string;
    projectId?: string;
    stackId?: string;
    scopeType?: ScopeType;
    scopeId?: string;
    sources: {
        organizationId?: ConfigSource;
        projectId?: ConfigSource;
        stackId?: ConfigSource;
    };
}
/**
 * Resolve organization, project, and stack IDs from a prioritized set of sources.
 * Precedence: flags > env > module > config.
 * Derives scopeType/scopeId from the resolved IDs (project > organization).
 *
 * Env vars are read from process.env by default (SANITY_ORGANIZATION_ID,
 * SANITY_PROJECT_ID, SANITY_BLUEPRINT_STACK_ID). Pass `env` explicitly to
 * override, or `null` to skip.
 */
export declare function resolveIds(sources?: IdSources): ResolvedIds;

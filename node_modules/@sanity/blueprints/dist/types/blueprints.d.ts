import type { BlueprintResource } from '../index.js';
/**
 * Additional configuration on a Blueprint that overrides the normal configuration
 * @internal
 */
export interface BlueprintsApiConfig {
    organizationId: string;
    projectId: string;
    stackId: string;
}
/**
 * A key-value pair that will be output from a Blueprint
 * @internal
 */
export interface BlueprintOutput {
    name: string;
    value: string;
}
/**
 * A representation of a Blueprint document
 * @category Blueprint Internals
 */
export interface Blueprint {
    $schema: string;
    blueprintVersion: string;
    resources?: BlueprintResource[];
    values?: Record<string, unknown>;
    outputs?: BlueprintOutput[];
}
/**
 * The result of defining a blueprint with `defineBlueprint`
 * @internal
 */
export type BlueprintModule = ((args?: unknown) => Blueprint) & Partial<BlueprintsApiConfig>;

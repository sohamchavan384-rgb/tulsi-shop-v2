import type { BlueprintError, BlueprintResource } from '../index.js';
/**
 * Validates that the given resource is a valid resource.
 * @param resource The resource
 * @param options Validation options
 * @internal
 * @returns A list of validation errors
 */
export declare function validateResource(resource: unknown, options?: {
    projectContained?: boolean;
}): BlueprintError[];
/**
 * @param resource The resource
 * @internal
 * @returns The resource
 */
export declare function assertResource(resource: unknown): asserts resource is BlueprintResource;

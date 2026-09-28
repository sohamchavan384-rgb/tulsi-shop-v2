import { type BlueprintError } from '../index.js';
/**
 * Validates that the given resource is a valid Role.
 * @param resource The Role resource
 * @category Validation
 * @returns A list of validation errors
 */
export declare function validateRole(resource: unknown): BlueprintError[];
/**
 * Validates that the given resource is a valid Project Role.
 * @param resource The Role resource
 * @category Validation
 * @returns A list of validation errors
 */
export declare function validateProjectRole(resource: unknown): BlueprintError[];

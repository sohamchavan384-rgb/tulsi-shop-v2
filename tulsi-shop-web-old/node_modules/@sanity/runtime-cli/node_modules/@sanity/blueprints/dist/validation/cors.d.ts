import { type BlueprintError } from '../index.js';
/**
 * Validates that the given resource is a valid CORS origin.
 * @param resource The CORS origin resource
 * @category Validation
 * @returns A list of validation errors
 */
export declare function validateCorsOrigin(resource: unknown): BlueprintError[];

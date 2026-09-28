import { type BlueprintError } from '../index.js';
/**
 * Validates that the given resource is a valid Robot Token.
 * @param resource The Robot Token resource
 * @category Validation
 * @returns A list of validation errors
 */
export declare function validateRobotToken(resource: unknown): BlueprintError[];
/**
 * Validates that the given membership is a valid Robot Token membership.
 * @param membership The membership to validate
 * @internal
 * @returns A list of validation errors
 */
export declare function validateRobotTokenMembership(membership: unknown): BlueprintError[];

import type { BlueprintError } from '../index.js';
/**
 * Validates that the given input is a valid Blueprint
 * @param blueprintConfig The blueprint configuration to be validated
 * @category Validation
 * @returns A list of validation errors
 */
export declare function validateBlueprint(blueprintConfig: unknown): BlueprintError[];

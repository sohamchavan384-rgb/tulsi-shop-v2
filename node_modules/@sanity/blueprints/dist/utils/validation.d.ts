import type { BlueprintError } from '../types/errors';
/**
 * Executes the given validator function and throws a formatted error if any are returned and throwError is enabled.
 * Otherwise collects errors for use later during blueprint validation.
 * @param validator A function that returns a list of validation errors.
 * @internal
 */
export declare function runValidation(validator: () => BlueprintError[], options?: {
    throwError?: boolean;
}): void;
/**
 * Gets the current set of errors that were returned during validation when resource definers were invoked.
 * @returns The errors collected during the validation of resources
 * @internal
 */
export declare function getCollectedErrors(): BlueprintError[];
/**
 * Resets the list of collected errors back to an empty list.
 * @internal
 */
export declare function resetCollectedErrors(): void;
/**
 * Checks whether a value is a blueprint reference expression.
 *
 * Recognized prefixes: `$.resources.*`, `$.values.*`, `$.parameters.*`, `$.params.*`.
 * @param value The value to check
 * @returns `true` if the value matches a known reference prefix
 * @internal
 */
export declare function isReference(value: unknown): boolean;

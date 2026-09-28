const collectedErrors = [];
/**
 * Executes the given validator function and throws a formatted error if any are returned and throwError is enabled.
 * Otherwise collects errors for use later during blueprint validation.
 * @param validator A function that returns a list of validation errors.
 * @internal
 */
export function runValidation(validator, options) {
    const errors = validator();
    if (options?.throwError && errors.length > 0) {
        const message = errors.map((err) => err.message).join('\n');
        throw new Error(message);
    }
    collectedErrors.push(...errors);
}
/**
 * Gets the current set of errors that were returned during validation when resource definers were invoked.
 * @returns The errors collected during the validation of resources
 * @internal
 */
export function getCollectedErrors() {
    return collectedErrors;
}
/**
 * Resets the list of collected errors back to an empty list.
 * @internal
 */
export function resetCollectedErrors() {
    collectedErrors.splice(0, collectedErrors.length);
}
const REFERENCE_PREFIXES = ['$.resources.', '$.values.', '$.parameters.', '$.params.'];
/**
 * Checks whether a value is a blueprint reference expression.
 *
 * Recognized prefixes: `$.resources.*`, `$.values.*`, `$.parameters.*`, `$.params.*`.
 * @param value The value to check
 * @returns `true` if the value matches a known reference prefix
 * @internal
 */
export function isReference(value) {
    return typeof value === 'string' && REFERENCE_PREFIXES.some((prefix) => value.startsWith(prefix));
}
//# sourceMappingURL=validation.js.map
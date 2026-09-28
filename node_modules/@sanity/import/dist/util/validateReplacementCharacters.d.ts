export declare class ReplacementCharError extends Error {
    constructor(message: string);
}
/**
 * Check if a string contains a Unicode replacement character (U+FFFD).
 * Returns the index of the first occurrence, or null if not found.
 */
export declare function checkStringForReplacementChar(str: string): number | null;
/**
 * Recursively search an object for strings containing U+FFFD.
 * Returns the path to the first occurrence, or null if not found.
 */
export declare function findReplacementCharInObject(obj: unknown, currentPath?: string): string | null;
/**
 * Validate that a raw NDJSON line doesn't contain U+FFFD.
 * Returns an error message if found, or null if clean.
 */
export declare function validateLineForReplacementChar(line: string, lineNumber: number): string | null;
/**
 * Validate that an assetMap doesn't contain U+FFFD in any string values.
 * Throws an error if found.
 */
export declare function validateAssetMapForReplacementChars(assetMap: Record<string, unknown>): void;
//# sourceMappingURL=validateReplacementCharacters.d.ts.map
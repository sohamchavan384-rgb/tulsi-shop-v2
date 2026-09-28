/**
 * Converts path separators to forward slashes for ESM imports.
 * @internal
 */ export function toForwardSlashes(filePath) {
    return filePath.replaceAll('\\', '/');
}

//# sourceMappingURL=toForwardSlashes.js.map
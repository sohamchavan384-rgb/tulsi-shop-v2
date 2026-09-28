import path from 'node:path';
/**
 * Builds the vendor portion of an import map from emitted Rolldown chunks.
 *
 * The returned paths are absolute (rooted at the served `basePath`) so the
 * browser can resolve the bare specifiers in the emitted import map regardless
 * of the document's location.
 *
 * @internal
 */ export function createVendorImportMapFromBundle(outputBundle, specifiersByChunkName, basePath) {
    const imports = {};
    for (const file of Object.values(outputBundle)){
        if (file.type !== 'chunk' || !file.isEntry) continue;
        const specifier = specifiersByChunkName[file.name];
        if (!specifier) continue;
        imports[specifier] = path.posix.join('/', basePath, file.fileName);
    }
    return imports;
}

//# sourceMappingURL=createVendorImportMapFromBundle.js.map
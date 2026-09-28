/**
 * Ensures that the given path both starts and ends with a single slash
 *
 * @internal
 */ export function normalizeBasePath(pathName) {
    return `/${pathName}/`.replace(/^\/+/, '/').replace(/\/+$/, '/');
}

//# sourceMappingURL=normalizeBasePath.js.map
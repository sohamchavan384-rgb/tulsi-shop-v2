import path from 'node:path';
/**
 * @internal
 */ export function getPossibleDocumentComponentLocations(rootPath) {
    return [
        path.join(rootPath, '_document.js'),
        path.join(rootPath, '_document.tsx')
    ];
}

//# sourceMappingURL=getPossibleDocumentComponentLocations.js.map
export function countNestedFolders(path) {
    const separator = path.includes('\\') ? '\\' : '/';
    return path.split(separator).filter(Boolean).length;
}

//# sourceMappingURL=countNestedFolders.js.map
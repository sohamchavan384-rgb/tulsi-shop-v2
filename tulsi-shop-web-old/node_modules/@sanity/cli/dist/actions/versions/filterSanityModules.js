/**
 * Filter the sanity modules from the package.json.
 *
 * @param manifest - The package.json manifest.
 * @returns The filtered sanity modules.
 */ export function filterSanityModules(manifest) {
    const dependencies = {
        ...manifest.dependencies,
        ...manifest.devDependencies
    };
    const filteredDependencies = {};
    for(const mod in dependencies){
        if (mod.startsWith('@sanity/') || mod === 'sanity') {
            filteredDependencies[mod] = dependencies[mod];
        }
    }
    return filteredDependencies;
}

//# sourceMappingURL=filterSanityModules.js.map
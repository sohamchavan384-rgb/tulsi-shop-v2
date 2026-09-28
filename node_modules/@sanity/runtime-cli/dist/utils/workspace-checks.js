import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
/**
 * Shared utility called by functions or blueprints to deterministically show warnings to users if it's not ideal
 * 1. Checks to see if the given filepath is in a studio specific workspace
 * 2. Checks to see if the given filepath is under a functions directory (/functions/sanity.blueprint.ts)
 * 3. Checks to see if the given filepath is in a self-contained directory (/blueprints/my-blueprint/sanity.blueprint.ts)
 * @param filePath
 */
export const checkWorkspaceStruct = (filePath) => {
    const startDir = resolve(filePath);
    let currentDir = startDir;
    let packageRoot = null;
    let underFunctionsDir = false;
    let isInStudio = false;
    while (true) {
        if (existsSync(join(currentDir, 'package.json'))) {
            packageRoot = currentDir;
            break;
        }
        const parent = dirname(currentDir);
        if (parent === currentDir)
            break;
        currentDir = parent;
    }
    try {
        isInStudio = readdirSync(startDir, { withFileTypes: true }).some((entry) => entry.isFile() &&
            (entry.name.startsWith('sanity.config') || entry.name.startsWith('sanity.cli')));
    }
    catch (_e) {
        // readdirSync lookup failed for some reason
        isInStudio = false;
    }
    if (packageRoot !== null) {
        const rel = packageRoot ? relative(packageRoot, startDir) : '';
        underFunctionsDir = rel.split(sep).includes('functions');
    }
    const isPackageRoot = packageRoot === startDir && !underFunctionsDir;
    const isFloating = !isInStudio && !isPackageRoot && !underFunctionsDir;
    return isInStudio
        ? 'studio'
        : underFunctionsDir
            ? 'functions'
            : isFloating
                ? 'floating'
                : undefined;
};

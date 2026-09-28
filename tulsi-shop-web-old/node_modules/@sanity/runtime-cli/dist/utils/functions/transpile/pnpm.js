import { createRequire } from 'node:module';
import path from 'node:path';
export const createPnpmRequire = (workspaceRoot) => {
    const pnpmModulesPath = path.join(workspaceRoot, 'node_modules', '.pnpm', 'node_modules');
    // createRequire gives us Node's full module resolution algorithm rooted at
    // the pnpm virtual store — it reads package.json exports/main and returns
    // the absolute path to the actual entry file, not just the directory.
    return createRequire(path.join(pnpmModulesPath, '_virtual.js'));
};

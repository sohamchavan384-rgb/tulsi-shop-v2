import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
/**
 * Patterns to identify native modules based on common file types and build configurations.
 */
const KNOWN_MODULE_PATTERNS = [/binding\.gyp$/, /\.node$/];
export const errorMessage = (elements) => `Native modules detected:\n${elements.join(`\n`)}\n\n Please replace with JavaScript alternatives`;
/**
 * Quick helper so we can recurse through pnpm symlinks if they exist
 * Fallback to statSync if it's a symlink
 */
const isDirEntry = (dir, parent) => {
    return (dir.isDirectory() ||
        (dir.isSymbolicLink() &&
            statSync(path.join(parent, dir.name), { throwIfNoEntry: false })?.isDirectory()));
};
/**
 * Recursively checks a directory for files that match known native module patterns.
 */
const hasNativeFiles = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        // don't recurse back into node_modules.
        if (entry.name === 'node_modules')
            continue;
        const fullPath = path.join(directory, entry.name);
        if (isDirEntry(entry, directory)) {
            if (hasNativeFiles(fullPath)) {
                return true;
            }
        }
        else if (KNOWN_MODULE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
            return true;
        }
    }
    return false;
};
/**
 * Scan the given path. Flag any packages that contain files matching known native module patterns, and return a list of their names.
 */
export const detectNativeModules = (nodeModules) => {
    // because to return the name, we might need to know the scoped package name
    const packages = readdirSync(nodeModules, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name.startsWith('@')) {
            if (!isDirEntry(entry, nodeModules)) {
                return [];
            }
            const scopePath = path.join(nodeModules, entry.name);
            return readdirSync(scopePath, { withFileTypes: true })
                .filter((pkg) => isDirEntry(pkg, scopePath))
                .map((pkg) => ({
                name: `${entry.name}/${pkg.name}`,
                dir: path.join(scopePath, pkg.name),
            }));
        }
        if (!isDirEntry(entry, nodeModules)) {
            return [];
        }
        return [{ name: entry.name, dir: path.join(nodeModules, entry.name) }];
    });
    return packages.filter(({ dir }) => hasNativeFiles(dir)).map(({ name }) => name);
};
export const findPackageDir = (pathName) => {
    if (!path.isAbsolute(pathName))
        return null;
    let currentDir = path.dirname(pathName);
    while (currentDir !== path.parse(currentDir).root) {
        // look for node_module package.json to locate top level
        if (existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
        }
        const parent = path.dirname(currentDir);
        // guard against infinite loop, especially if relative paths are being used ie: '.'
        if (parent === currentDir)
            return null;
        currentDir = parent;
    }
    return null;
};
/**
 * A vite plugin that compares resolved deps of a function against known native module patterns, and throws an error if any are found.
 */
export const detectNativeModulesPlugin = () => {
    const flagged = new Set();
    return {
        name: 'detect-native-modules',
        enforce: 'pre',
        async resolveId(source, importer, options) {
            // skip relative imports
            if (source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) {
                return null;
            }
            const [scope, name] = source.split('/');
            const pkgName = source.startsWith('@') ? `${scope}/${name}` : scope;
            if (!pkgName) {
                return null;
            }
            const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
            if (!resolved)
                return null;
            const pkgDir = findPackageDir(resolved.id);
            if (!pkgDir) {
                return null;
            }
            if (hasNativeFiles(pkgDir)) {
                flagged.add(source);
            }
            return null;
        },
        buildEnd() {
            if (flagged.size > 0) {
                this.error(errorMessage([...flagged]));
            }
        },
    };
};

import { readFile, realpath } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { subdebug } from '@sanity/cli-core';
const debug = subdebug('updateChecker');
const KNOWN_PACKAGES = new Set([
    '@sanity/cli',
    'sanity'
]);
const MAX_WALK_ITERATIONS = 25;
/**
 * Resolve the Sanity package name + installed version from a runner install.
 * Falls back to `sanity` + `fallbackVersion` when the walk can't determine them.
 */ export async function resolveRunnerPackage(binaryPath = process.argv[1] ?? '', fallbackVersion = '') {
    try {
        // Follow the runner's .bin/sanity symlink to the real bin file, then walk
        // up until we hit a package.json for a known Sanity package.
        let dir = dirname(await realpath(binaryPath));
        for(let i = 0; i < MAX_WALK_ITERATIONS && dir !== resolve(dir, '..'); i++){
            try {
                const pkg = JSON.parse(await readFile(resolve(dir, 'package.json'), 'utf8'));
                if (typeof pkg.name === 'string' && typeof pkg.version === 'string' && isKnownSanityPackage(pkg.name)) {
                    return {
                        installedVersion: pkg.version,
                        packageName: pkg.name
                    };
                }
            } catch  {
            // ignore missing/malformed package.json and keep walking
            }
            dir = dirname(dir);
        }
        debug('resolveRunnerPackage: walk exhausted without finding a known Sanity package');
    } catch (err) {
        debug('resolveRunnerPackage: realpath failed for %s (%s)', binaryPath, err);
    }
    return {
        installedVersion: fallbackVersion,
        packageName: 'sanity'
    };
}
function isKnownSanityPackage(name) {
    return KNOWN_PACKAGES.has(name);
}

//# sourceMappingURL=resolveRunnerPackage.js.map
import path from 'node:path';
import { isInteractive } from '@sanity/cli-core';
import { getRunningPackageManager } from '@sanity/cli-core/package-manager';
import { select } from '@sanity/cli-core/ux';
import which from 'which';
import { preferredPm } from './preferredPm.js';
const EXPERIMENTAL = new Set([
    'bun'
]);
export const ALLOWED_PACKAGE_MANAGERS = [
    'npm',
    'yarn',
    'pnpm',
    'bun',
    'manual'
];
export const allowedPackageManagersString = ALLOWED_PACKAGE_MANAGERS.join(' | ');
/**
 * Attempts to resolve the most optimal package manager to use to install/upgrade
 * packages/dependencies at a given path. It does so by looking for package manager
 * specific lockfiles. If it finds a lockfile belonging to a certain package manager,
 * it prioritizes this one. However, if that package manager is not installed, it will
 * prompt the user for which one they want to use and hint at the most optimal one
 * not being installed.
 *
 * Note that this function also takes local npm binary paths into account - for instance,
 * `yarn` can be installed as a dependency of the project instead of globally, and it
 * will use that is available.
 *
 * The user can also select 'manual' to skip the process and run their preferred package
 * manager manually. Commands using this function must take this `manual` choice into
 * account and act accordingly if chosen.
 *
 * @param workDir - The working directory where a lockfile is most likely to be present
 * @param options - Pass `interactive: false` to fall back to npm if most optimal is
 *                  not available, instead of prompting
 * @returns Object of `chosen` and, if a lockfile is found, the `mostOptimal` choice
 */ export async function getPackageManagerChoice(workDir, options) {
    const rootDir = workDir || process.cwd();
    const preferred = preferredPm(rootDir) ?? undefined;
    if (preferred && await hasCommand(preferred, rootDir)) {
        // There is an optimal/preferred package manager, and the user has it installed!
        return {
            chosen: preferred,
            mostOptimal: preferred
        };
    }
    const mostLikelyPM = await getMostLikelyInstalledPackageManager(rootDir);
    const interactive = typeof options.interactive === 'boolean' ? options.interactive : isInteractive();
    if (!interactive) {
        // We can't ask the user for their preference, so fall back to either the one that is being run
        // or whatever is installed on the system (npm being the preferred choice).
        // Note that the most optimal choice is already picked above if available.
        return {
            chosen: mostLikelyPM || await getFallback(rootDir),
            mostOptimal: preferred
        };
    }
    // We can ask the user for their preference, hurray!
    const messageSuffix = preferred ? ` (preferred is ${preferred}, but is not installed)` : '';
    const installed = await getAvailablePackageManagers(rootDir);
    const chosen = await select({
        choices: installed.map((pm)=>({
                name: EXPERIMENTAL.has(pm) ? `${pm} (experimental)` : pm,
                value: pm
            })),
        default: preferred || mostLikelyPM,
        message: `Package manager to use for installing dependencies?${messageSuffix}`
    });
    return {
        chosen,
        mostOptimal: preferred
    };
}
async function getFallback(cwd) {
    if (await hasNpmInstalled(cwd)) {
        return 'npm';
    }
    if (await hasYarnInstalled(cwd)) {
        return 'yarn';
    }
    if (await hasPnpmInstalled(cwd)) {
        return 'pnpm';
    }
    if (await hasBunInstalled(cwd)) {
        return 'bun';
    }
    return 'manual';
}
async function getAvailablePackageManagers(cwd) {
    const [npm, yarn, pnpm, bun] = await Promise.all([
        hasNpmInstalled(cwd),
        hasYarnInstalled(cwd),
        hasPnpmInstalled(cwd),
        hasBunInstalled(cwd)
    ]);
    const choices = [
        npm && 'npm',
        yarn && 'yarn',
        pnpm && 'pnpm',
        bun && 'bun',
        'manual'
    ];
    return choices.filter((pm)=>pm !== false);
}
function hasNpmInstalled(cwd) {
    return hasCommand('npm', cwd);
}
function hasYarnInstalled(cwd) {
    return hasCommand('yarn', cwd);
}
function hasPnpmInstalled(cwd) {
    return hasCommand('pnpm', cwd);
}
function hasBunInstalled(cwd) {
    return hasCommand('bun', cwd);
}
function getNpmRunPath(cwd) {
    let previous;
    let cwdPath = path.resolve(cwd);
    const result = [];
    while(previous !== cwdPath){
        result.push(path.join(cwdPath, 'node_modules', '.bin'));
        previous = cwdPath;
        cwdPath = path.resolve(cwdPath, '..');
    }
    result.push(path.resolve(cwd, process.execPath, '..'));
    const pathEnv = process.env[getPathEnvVarKey()];
    return [
        ...result,
        pathEnv
    ].join(path.delimiter);
}
export function getPartialEnvWithNpmPath(cwd) {
    const key = getPathEnvVarKey();
    return {
        [key]: getNpmRunPath(cwd)
    };
}
function getPathEnvVarKey() {
    if (process.platform !== 'win32') {
        return 'PATH';
    }
    return Object.keys(process.env).toReversed().find((key)=>key.toUpperCase() === 'PATH') || 'Path';
}
function getCommandPath(cmd, cwd) {
    const options = cwd ? {
        path: getNpmRunPath(cwd)
    } : undefined;
    return which(cmd, options).catch(()=>null);
}
function hasCommand(cmd, cwd) {
    return getCommandPath(cmd, cwd).then((cmdPath)=>cmdPath !== null);
}
async function getMostLikelyInstalledPackageManager(rootDir) {
    const installed = await getAvailablePackageManagers(rootDir);
    const running = getRunningPackageManager();
    return running && installed.includes(running) ? running : undefined;
}

//# sourceMappingURL=packageManagerChoice.js.map
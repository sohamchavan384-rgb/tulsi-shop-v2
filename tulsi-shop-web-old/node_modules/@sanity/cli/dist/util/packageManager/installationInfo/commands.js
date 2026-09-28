import { getYarnMajorVersion } from '@sanity/cli-core/package-manager';
export function getGlobalUninstallCommand(pm, packageName) {
    switch(pm){
        case 'bun':
            {
                return `bun remove -g ${packageName}`;
            }
        case 'npm':
            {
                return `npm uninstall -g ${packageName}`;
            }
        case 'pnpm':
            {
                return `pnpm remove -g ${packageName}`;
            }
        case 'yarn':
            {
                // The pm is 'yarn' because queryYarnGlobals found the package, meaning
                // it was installed with Yarn Classic (`yarn global add`). Only Yarn
                // Classic can uninstall it — the project's yarn version is irrelevant.
                return `yarn global remove ${packageName}`;
            }
    }
}
export function getLocalUpdateCommand(pm, packageName, options) {
    switch(pm){
        case 'bun':
            {
                return `bun update ${packageName}`;
            }
        case 'npm':
            {
                return `npm update ${packageName}`;
            }
        case 'pnpm':
            {
                return `pnpm update ${packageName}`;
            }
        case 'yarn':
            {
                // Prefer project-level detection (.yarnrc.yml) over process user-agent,
                // since the doctor command may be invoked via a different package manager.
                const isBerry = options?.yarnBerry ?? isYarnBerryFromProcess();
                return `yarn ${isBerry ? 'up' : 'upgrade'} ${packageName}`;
            }
    }
}
function isYarnBerryFromProcess() {
    const yarnMajor = getYarnMajorVersion();
    return yarnMajor !== undefined && yarnMajor >= 2;
}
export function getLocalRemoveCommand(pm, packageName) {
    switch(pm){
        case 'bun':
            {
                return `bun remove ${packageName}`;
            }
        case 'npm':
            {
                return `npm uninstall ${packageName}`;
            }
        case 'pnpm':
            {
                return `pnpm remove ${packageName}`;
            }
        case 'yarn':
            {
                return `yarn remove ${packageName}`;
            }
    }
}

//# sourceMappingURL=commands.js.map
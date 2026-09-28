import { getYarnMajorVersion } from '@sanity/cli-core/package-manager';
/**
 * Get the appropriate update command for the package manager
 */ export function getUpdateCommand(pm, packageName) {
    if (pm === 'yarn') {
        const yarnMajor = getYarnMajorVersion();
        const cmd = yarnMajor !== undefined && yarnMajor >= 2 ? 'up' : 'upgrade';
        return `yarn ${cmd} ${packageName}`;
    }
    const localCommands = {
        bun: `bun update ${packageName}`,
        manual: `npm update ${packageName}`,
        npm: `npm update ${packageName}`,
        pnpm: `pnpm update ${packageName}`
    };
    return localCommands[pm];
}

//# sourceMappingURL=getUpdateCommand.js.map
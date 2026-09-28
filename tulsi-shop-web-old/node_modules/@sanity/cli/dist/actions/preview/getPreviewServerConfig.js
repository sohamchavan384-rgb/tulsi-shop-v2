import { getSharedServerConfig } from '../../util/getSharedServerConfig.js';
export function getPreviewServerConfig(options) {
    const { cliConfig, flags, rootDir, workDir } = options;
    const baseConfig = getSharedServerConfig({
        cliConfig,
        flags,
        workDir
    });
    return {
        ...baseConfig,
        root: rootDir,
        workDir
    };
}

//# sourceMappingURL=getPreviewServerConfig.js.map
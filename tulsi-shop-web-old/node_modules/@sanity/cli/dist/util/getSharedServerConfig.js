import { getSanityEnvVar } from '@sanity/cli-core';
import { determineIsApp } from './determineIsApp.js';
import { ensureTrailingSlash } from './ensureTrailingSlash.js';
import { toInt } from './toInt.js';
/**
 * @internal
 *
 * Resolves the shared configuration for the dev/preview server using:
 *
 * - CLI flags
 * - Environment variables
 * - User build config
 * - Default configuration
 */ export function getSharedServerConfig({ cliConfig, flags, workDir }) {
    // Order of preference: CLI flags, environment variables, user build config, default config
    const isApp = cliConfig ? determineIsApp(cliConfig) : false;
    const httpHost = flags.host || getSanityEnvVar('SERVER_HOSTNAME', isApp ?? false) || cliConfig?.server?.hostname || 'localhost';
    const httpPort = toInt(flags.port || getSanityEnvVar('SERVER_PORT', isApp ?? false) || cliConfig?.server?.port, 3333);
    const basePath = ensureTrailingSlash(getSanityEnvVar('BASEPATH', isApp ?? false) ?? (cliConfig?.project?.basePath || '/'));
    const entry = cliConfig?.app?.entry;
    return {
        basePath,
        cwd: workDir,
        entry,
        httpHost,
        httpPort,
        isApp,
        schemaExtraction: cliConfig?.schemaExtraction,
        vite: cliConfig?.vite
    };
}

//# sourceMappingURL=getSharedServerConfig.js.map
import { styleText } from 'node:util';
import { warn } from '@oclif/core/ux';
import { debug, findProjectRoot } from '@sanity/cli-core';
import { loadEnv } from 'vite';
import { getSanityEnv } from '../../util/getSanityEnv.js';
export const injectEnvVariables = async function({ Command }) {
    let workDir;
    try {
        workDir = await findProjectRoot(process.cwd());
    } catch  {
    // Accept not finding a project root
    }
    if (!workDir) {
        return;
    }
    // Use `production` for `sanity build` / `sanity deploy`,
    // but default to `development` for everything else unless `SANITY_ACTIVE_ENV` is set
    const isProdCmd = [
        'build',
        'deploy'
    ].includes(Command.id);
    let mode = process.env.SANITY_ACTIVE_ENV;
    if (!mode && (isProdCmd || process.env.NODE_ENV === 'production')) {
        mode = 'production';
    } else if (!mode) {
        mode = 'development';
    }
    if (mode === 'production' && !isProdCmd) {
        warn(styleText('yellow', `Running in ${getSanityEnv()} environment mode\n`));
    }
    debug('Loading environment files using %s mode', mode);
    // Empty prefix loads all variables from .env files, not just SANITY_STUDIO_/SANITY_APP_ prefixed ones.
    // Client bundle exposure is separately controlled by Vite's envPrefix in getViteConfig.ts.
    const studioEnv = loadEnv(mode, workDir.directory, '');
    Object.assign(process.env, studioEnv);
};

//# sourceMappingURL=injectEnvVariables.js.map
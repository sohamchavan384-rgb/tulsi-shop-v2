import { getSanityEnv } from '../../util/getSanityEnv.js';
import { createOrAppendEnvVars } from './env/createOrAppendEnvVars.js';
import { fetchPostInitPrompt } from './fetchPostInitPrompt.js';
export function shouldPrompt(unattended, flagValue) {
    return !unattended && flagValue === undefined;
}
export function flagOrDefault(flagValue, defaultValue) {
    return typeof flagValue === 'boolean' ? flagValue : defaultValue;
}
export async function getPostInitMCPPrompt(editorsNames) {
    return fetchPostInitPrompt(new Intl.ListFormat('en').format(editorsNames));
}
export async function writeStagingEnvIfNeeded(output, outputPath) {
    const sanityEnv = getSanityEnv();
    if (sanityEnv === 'production') return;
    await createOrAppendEnvVars({
        envVars: {
            INTERNAL_ENV: sanityEnv
        },
        filename: '.env',
        framework: null,
        log: false,
        output,
        outputPath
    });
}

//# sourceMappingURL=initHelpers.js.map
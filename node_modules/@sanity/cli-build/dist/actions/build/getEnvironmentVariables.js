import { loadEnv } from 'vite';
const appEnvPrefix = 'SANITY_APP_';
const studioEnvPrefix = 'SANITY_STUDIO_';
/**
 * Get environment variables prefixed with SANITY_STUDIO_, as an object.
 *
 * @param options - Options for the environment variable loading
 *  {@link StudioEnvVariablesOptions}
 * @returns Object of studio environment variables
 *
 * @example
 * ```tsx
 * getStudioEnvironmentVariables({prefix: 'process.env.', jsonEncode: true})
 * ```
 *
 * @public
 */ export function getStudioEnvironmentVariables(options = {}) {
    return getEnvironmentVariables({
        ...options,
        varTypePrefix: studioEnvPrefix
    });
}
/**
 * Get environment variables prefixed with SANITY_APP_, as an object.
 *
 * @param options - Options for the environment variable loading
 *  {@link StudioEnvVariablesOptions}
 * @returns Object of app environment variables
 *
 * @internal
 */ export function getAppEnvironmentVariables(options = {}) {
    return getEnvironmentVariables({
        ...options,
        varTypePrefix: appEnvPrefix
    });
}
function getEnvironmentVariables(options) {
    const { envFile = false, jsonEncode = false, prefix = '', varTypePrefix } = options;
    const fullEnv = envFile ? {
        ...process.env,
        ...loadEnv(envFile.mode, envFile.envDir || process.cwd(), [
            varTypePrefix
        ])
    } : process.env;
    const appEnv = {};
    for(const key in fullEnv){
        if (key.startsWith(varTypePrefix)) {
            appEnv[`${prefix}${key}`] = jsonEncode ? JSON.stringify(fullEnv[key] || '') : fullEnv[key] || '';
        }
    }
    return appEnv;
}

//# sourceMappingURL=getEnvironmentVariables.js.map
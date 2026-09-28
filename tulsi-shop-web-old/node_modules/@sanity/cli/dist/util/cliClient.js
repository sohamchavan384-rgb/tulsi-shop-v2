import { findProjectRootSync, getCliConfigSync } from '@sanity/cli-core';
import { createClient } from '@sanity/client';
/**
 * @public
 *
 * @param options - The options to use for the client.
 * @returns A configured Sanity API client.
 */ export const getCliClient = (options = {})=>{
    if (typeof process !== 'object') {
        throw new TypeError('getCliClient() should only be called from node.js scripts');
    }
    const { apiVersion = '2022-06-06', cwd = process.env.SANITY_BASE_PATH || process.cwd(), dataset, projectId, token = getCliClient.__internal__getToken() ?? (process.env.SANITY_AUTH_TOKEN || undefined), useCdn = false, ...restOfOptions } = options;
    if (projectId && dataset) {
        return createClient({
            apiVersion,
            dataset,
            projectId,
            token,
            useCdn,
            ...restOfOptions
        });
    }
    const projectRoot = findProjectRootSync(cwd);
    const cliConfig = getCliConfigSync(projectRoot.directory);
    if (!cliConfig) {
        throw new Error('Unable to resolve CLI configuration');
    }
    const apiConfig = cliConfig.api || {};
    if (!apiConfig.projectId || !apiConfig.dataset) {
        throw new Error('Unable to resolve project ID/dataset from CLI configuration');
    }
    return createClient({
        apiVersion,
        dataset: apiConfig.dataset,
        projectId: apiConfig.projectId,
        token,
        useCdn,
        ...restOfOptions
    });
};
getCliClient.__internal__getToken = ()=>undefined;

//# sourceMappingURL=cliClient.js.map
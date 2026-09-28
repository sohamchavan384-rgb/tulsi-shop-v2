import { isMainThread } from 'node:worker_threads';
import { findStudioConfigPath, getCliConfig, studioWorkerTask } from '@sanity/cli-core';
export async function getGraphQLAPIs(workDir) {
    if (!isMainThread) {
        throw new Error('getGraphQLAPIs() must be called from the main thread');
    }
    const [cliConfig, configPath] = await Promise.all([
        getCliConfig(workDir),
        findStudioConfigPath(workDir)
    ]);
    return studioWorkerTask(new URL('getGraphQLAPIs.worker.js', import.meta.url), {
        name: 'getGraphQLAPIs',
        studioRootPath: workDir,
        workerData: {
            cliConfig: {
                graphql: cliConfig.graphql
            },
            configPath
        }
    });
}

//# sourceMappingURL=getGraphQLAPIs.js.map
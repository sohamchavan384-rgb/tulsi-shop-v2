import { formatDeployedResourceTree, formatStackInfo, } from '../../utils/display/blueprints-formatting.js';
export async function blueprintInfoCore(options) {
    const { log, deployedStack, flags } = options;
    const { verbose = false } = flags;
    try {
        log(formatStackInfo(deployedStack, true));
        if (deployedStack.resources)
            log(formatDeployedResourceTree(deployedStack.resources, verbose));
        return { success: true, json: { stack: deployedStack } };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Error: ${errorMessage}`);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

import { list } from '../../../actions/functions/env/list.js';
import { findFunctionInStack } from '../../../utils/functions/find.js';
import { resolveFunctionAuth } from '../../../utils/functions/resolve-auth.js';
export async function functionEnvListCore(options) {
    const { args, log } = options;
    const spinner = log.ora(`Listing environment variables for "${args.name}"`).start();
    const resource = findFunctionInStack(options.deployedStack, args.name);
    const { externalId } = resource;
    const auth = resolveFunctionAuth(options.auth, options.deployedStack, resource);
    const result = await list(externalId, auth, options.log);
    if (!result.ok) {
        spinner.stop();
        return { success: false, error: result.error || 'Unknown error' };
    }
    spinner.succeed(`Environment variables for "${args.name}"`);
    for (const key of result.envvars) {
        options.log(key);
    }
    return { success: true, json: { name: args.name, envvars: result.envvars } };
}

import { remove } from '../../../actions/functions/env/remove.js';
import { findFunctionInStack } from '../../../utils/functions/find.js';
import { resolveFunctionAuth } from '../../../utils/functions/resolve-auth.js';
import { styleText } from '../../../utils/style-text.js';
export async function functionEnvRemoveCore(options) {
    const { args, log } = options;
    const spinner = log.ora(`Removing "${args.key}" environment variable in "${args.name}"`).start();
    const resource = findFunctionInStack(options.deployedStack, args.name);
    const { externalId } = resource;
    const auth = resolveFunctionAuth(options.auth, options.deployedStack, resource);
    const result = await remove(externalId, args.key, auth, options.log);
    if (!result.ok) {
        spinner.fail(`${styleText('red', 'Failed')} to remove ${args.key}`);
        return { success: false, error: result.error || 'Unknown error' };
    }
    spinner.succeed(`Removal of ${args.key} succeeded`);
    return { success: true, json: { name: args.name, key: args.key } };
}

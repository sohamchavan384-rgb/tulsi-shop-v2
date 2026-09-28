import { input } from '@sanity/cli-core/ux';
import { validateDatasetAliasName } from '../actions/dataset/validateDatasetAliasName.js';
export function promptForDatasetAliasName(options = {}) {
    return input({
        default: options.default,
        message: options.message || 'Alias name:',
        validate: (name)=>{
            const err = validateDatasetAliasName(name);
            if (err) {
                return err;
            }
            return true;
        }
    });
}

//# sourceMappingURL=promptForDatasetAliasName.js.map
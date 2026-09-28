import { input } from '@sanity/cli-core/ux';
import { validateDatasetName } from '../actions/dataset/validateDatasetName.js';
export function promptForDatasetName(options = {}, existingDatasets = []) {
    return input({
        default: options.default,
        message: options.message || 'Dataset name:',
        validate: (name)=>{
            if (existingDatasets.includes(name)) {
                return 'Dataset name already exists';
            }
            const err = validateDatasetName(name);
            if (err) {
                return err;
            }
            return true;
        }
    });
}

//# sourceMappingURL=promptForDatasetName.js.map
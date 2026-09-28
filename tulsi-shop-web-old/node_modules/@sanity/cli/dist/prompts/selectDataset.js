import { select } from '@sanity/cli-core/ux';
export function selectDataset(datasets, options = {}) {
    return select({
        choices: datasets.map((name)=>({
                name,
                value: name
            })),
        message: options.message || 'Select target dataset:'
    });
}

//# sourceMappingURL=selectDataset.js.map
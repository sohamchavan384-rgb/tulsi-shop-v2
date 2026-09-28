import { select } from '@sanity/cli-core/ux';
export const NEW_DATASET_VALUE = '-NEW-';
/**
 * Prompts the user to select a dataset from a list of datasets
 *
 * @param datasets - The list of datasets to choose from
 * @param allowCreation - Whether to allow the user to create a new dataset
 * @returns The selected dataset name
 *
 * @internal
 */ export async function promptForDataset(options) {
    const { allowCreation, datasets } = options;
    let choices = datasets.map((dataset)=>({
            name: dataset.name,
            value: dataset.name
        }));
    if (allowCreation) {
        choices = [
            {
                name: 'Create new dataset',
                value: NEW_DATASET_VALUE
            },
            ...choices
        ];
    }
    return select({
        choices,
        message: 'Select the dataset name:'
    });
}

//# sourceMappingURL=promptForDataset.js.map
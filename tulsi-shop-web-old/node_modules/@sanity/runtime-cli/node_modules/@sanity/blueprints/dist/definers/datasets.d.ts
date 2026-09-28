import { type BlueprintDatasetConfig, type BlueprintDatasetResource } from '../index.js';
/**
 * Defines a Dataset to be managed in a Blueprint.
 *
 * ```ts
 * defineDataset({
 *   name: 'staging-dataset',
 *   datasetName: 'staging',
 * })
 * ```
 * @param parameters The dataset configuration
 * @public
 * @alpha Deploying Datasets via Blueprints is experimental. This feature is subject to breaking changes.
 * @hidden
 * @category Definers
 * @expandType BlueprintDatasetConfig
 * @returns The dataset resource
 */
export declare function defineDataset(parameters: BlueprintDatasetConfig): BlueprintDatasetResource;

import {type BlueprintDatasetConfig, type BlueprintDatasetResource, validateDataset} from '../index.js'
import {runValidation} from '../utils/validation.js'

/*
 * FUTURE example (move below @example when ready)
 * @example All options
 * ```ts
 * defineDataset({
 *   name: 'staging',
 *   datasetName: 'staging-v2',
 *   visibility: 'private',
 *   project: 'my-project-id',
 *   lifecycle: {deletionPolicy: 'protect'},
 * })
 * ```
 */
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
export function defineDataset(parameters: BlueprintDatasetConfig): BlueprintDatasetResource {
  // default dataset name and acl mode
  const datasetName = parameters.datasetName || parameters.name
  const aclMode = parameters.aclMode || parameters.visibility || 'public'

  const datasetResource: BlueprintDatasetResource = {
    ...parameters,
    datasetName,
    aclMode,
    type: 'sanity.project.dataset',
  }

  runValidation(() => validateDataset(datasetResource))

  return datasetResource
}

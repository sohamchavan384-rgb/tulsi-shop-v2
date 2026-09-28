import {type BlueprintDurableConfig, type BlueprintDurableFunctionResource, validateDurableFunction} from '../../index.js'
import {runValidation} from '../../utils/validation.js'
import {defineFunction} from './index.js'

/**
 * Defines a durable function resource.
 *
 * @remarks
 *
 * ```ts
 * defineDurableFunction({
 *   name: 'daily-cleanup',
 *   event: {type: 'document', on: ['create'], filter: "_type == 'post'"},
 *   concurrency: 5,
 *   debounce: 10,
 *   debounceKey: 'document._id',
 * })
 * ```
 *
 *
 * @param functionConfig The configuration for the function
 * @category Definers
 * @alpha Deploying Durable Functions via Blueprints is experimental. This feature is not available publicly yet.
 * @public
 * @hidden
 * @expandType BlueprintPipelineConfig
 * @returns The validated durable function resource
 */
export function defineDurableFunction(functionConfig: BlueprintDurableConfig): BlueprintDurableFunctionResource {
  const {name, event, concurrency, debounce, debounceKey, src} = functionConfig
  const functionResource: BlueprintDurableFunctionResource = {
    ...defineFunction({...functionConfig, src: src ?? `functions/${name}`}, {skipValidation: true}),
    type: 'sanity.function.durable',
    ...(event !== undefined && {event}),
    ...(concurrency !== undefined && {concurrency}),
    ...(debounce !== undefined && {debounce}),
    ...(debounceKey !== undefined && {debounceKey}),
  }

  runValidation(() => validateDurableFunction(functionResource))
  return functionResource
}

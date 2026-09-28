import {type BlueprintQueueFunctionConfig, type BlueprintQueueFunctionResource, validateQueueFunction} from '../../index.js'
import {runValidation} from '../../utils/validation.js'
import {defineFunction} from './index.js'
/**
 * Defines a function that provide queueing behaviour.
 *
 * @remarks
 * Using the reasonable defaults of concurrency: 1, fifo: true, and dlq: true
 * ```ts
 * defineQueueFunction({
 *   name: 'send-email',
 * })
 * ```
 *
 * Specifying a concurrency of 5
 * ```ts
 * defineQueueFunction({
 *   name: 'bustin-caches',
 *   concurrency: 5,
 *   fifo: true,
 *   dlq: true,
 * })
 * ```
 * @public
 * @alpha Deploying Queue Functions via Blueprints is experimental. This feature is not available publicly yet.
 * @hidden
 * @category Definers
 * @expandType BlueprintQueueFunctionConfig
 * @param functionConfig The configuration for the queue function
 * @returns The validated queue function resource
 */
export function defineQueueFunction(functionConfig: BlueprintQueueFunctionConfig): BlueprintQueueFunctionResource {
  const {concurrency = 1, fifo = true, dlq = true, debounce, debounceKey, event} = functionConfig

  const functionResource: BlueprintQueueFunctionResource = {
    ...defineFunction(functionConfig, {skipValidation: true}),
    type: 'sanity.function.queue',
    ...(concurrency !== undefined && {concurrency}),
    ...(debounce !== undefined && {debounce}),
    ...(debounceKey !== undefined && {debounceKey}),
    ...(dlq !== undefined && {dlq}),
    ...(event !== undefined && {event}),
    ...(fifo !== undefined && {fifo}),
  }

  runValidation(() => validateQueueFunction(functionResource))

  return functionResource
}

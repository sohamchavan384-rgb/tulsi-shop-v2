import {type BlueprintBaseFunctionConfig, type BlueprintBaseFunctionResource, validateFunction} from '../../index.js'
import {runValidation} from '../../utils/validation.js'

/**
 * Defines a base function resource with common properties.
 *
 * @param functionConfig The configuration for the function
 * @param options Optional configuration including validation options
 * @category Definers
 * @internal
 * @expandType BlueprintBaseFunctionConfig
 * @returns The validated function resource
 */
export function defineFunction(
  functionConfig: BlueprintBaseFunctionConfig,
  options?: {skipValidation?: boolean; scopeType?: 'organization'},
): BlueprintBaseFunctionResource {
  const {name, displayName, src, timeout, memory, env, robotToken, project, runtime, lifecycle} = functionConfig

  const functionResource: BlueprintBaseFunctionResource = {
    type: 'sanity.function.document',
    name,
    src: src ?? `functions/${name}`,
    displayName,
    timeout,
    memory,
    env,
    robotToken,
    runtime,
  }

  if (options?.scopeType !== 'organization' && project) functionResource.project = project

  if (lifecycle) functionResource.lifecycle = lifecycle

  if (options?.skipValidation !== true) runValidation(() => validateFunction(functionResource))

  return functionResource
}

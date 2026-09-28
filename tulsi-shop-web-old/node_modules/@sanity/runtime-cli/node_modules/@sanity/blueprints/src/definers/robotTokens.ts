import {
  type BlueprintCrossStackReferenceConfig,
  type BlueprintResource,
  type BlueprintRobotTokenConfig,
  type BlueprintRobotTokenResource,
  referenceResource,
  validateRobotToken,
} from '../index.js'
import {runValidation} from '../utils/validation.js'

/*
 * FUTURE example (move below @example when ready)
 * @example Cross-resource references
 * ```ts
 * defineRole({
 *   name: 'ci-deploy-role',
 *   title: 'CI Deploy Role',
 *   appliesToRobots: true,
 *   permissions: [{name: 'sanity-project-cors', action: 'create'}],
 * })
 *
 * defineRobotToken({
 *   name: 'ci-robot',
 *   label: 'CI Deploy Robot',
 *   memberships: [{
 *     roleNames: ['$.resources.ci-deploy-role'],
 *   }],
 * })
 * ```
 */
/**
 * Defines a Robot Token for automated access. Has a token property provided during deployment that can be referenced by other resources.
 *
 * ```ts
 * defineRobotToken({
 *   name: 'my-robot',
 *   memberships: [{
 *     resourceType: 'project',
 *     resourceId: projectId,
 *     roleNames: ['editor'],
 *   }],
 * })
 * ```
 * @param parameters The robot token configuration
 * @public
 * @beta Deploying Robot Tokens via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Definers
 * @expandType BlueprintRobotTokenConfig
 * @returns The robot token resource
 */
export function defineRobotToken(parameters: BlueprintRobotTokenConfig): BlueprintRobotTokenResource {
  const label = parameters.label || parameters.name

  const robotResource: BlueprintRobotTokenResource = {
    ...parameters,
    label,
    type: 'sanity.access.robot',
  }

  runValidation(() => validateRobotToken(robotResource))

  return robotResource
}

/**
 * Creates a reference to a robot token in another stack.
 *
 * ```ts
 * referenceRobotToken({
 *   name: 'editor-token',
 *   stack: 'editorial',
 * })
 * ```
 *
 * @public
 * @beta Referencing Robot Tokens via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Referencers
 * @expandType BlueprintCrossStackReferenceConfig
 * @param params The parameters for referencing the robot token
 * @returns The robot token reference
 */
export function referenceRobotToken({name, stack, localName}: BlueprintCrossStackReferenceConfig): BlueprintResource {
  return referenceResource({name, stack, localName, type: 'sanity.access.robot'})
}

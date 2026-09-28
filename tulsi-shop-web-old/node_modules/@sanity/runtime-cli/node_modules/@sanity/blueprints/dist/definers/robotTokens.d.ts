import { type BlueprintCrossStackReferenceConfig, type BlueprintResource, type BlueprintRobotTokenConfig, type BlueprintRobotTokenResource } from '../index.js';
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
export declare function defineRobotToken(parameters: BlueprintRobotTokenConfig): BlueprintRobotTokenResource;
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
export declare function referenceRobotToken({ name, stack, localName }: BlueprintCrossStackReferenceConfig): BlueprintResource;

import { type BlueprintCrossStackReferenceConfig, type BlueprintProjectRoleResource, type BlueprintResource, type BlueprintRoleConfig, type BlueprintRoleResource } from '../index.js';
/**
 * Defines a role that is scoped to the same resource as the blueprint.
 *
 * ```ts
 * defineRole({
 *   name: 'custom-robot-role',
 *   title: 'Custom Robot Role',
 *   appliesToRobots: true,
 *   permissions: [{
 *     name: 'sanity-project-cors',
 *     action: 'create',
 *   }],
 * })
 * ```
 * @param parameters The configuration of the role
 * @public
 * @beta Deploying Roles via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Definers
 * @expandType BlueprintRoleConfig
 * @returns The role resource
 */
export declare function defineRole(parameters: BlueprintRoleConfig, options?: {
    skipValidation?: boolean;
}): BlueprintRoleResource;
/**
 * Defines a role that is scoped to the specified project.
 *
 * ```ts
 * defineProjectRole(projectId, {
 *   name: 'viewer-role',
 *   title: 'Viewer',
 *   appliesToUsers: true,
 *   permissions: [{
 *     name: 'sanity-project-cors',
 *     action: 'read',
 *   }],
 * })
 * ```
 * @public
 * @beta Deploying Roles via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @hidden
 * @category Definers
 * @expandType BlueprintRoleConfig
 * @param projectId The ID of the project to which the role will be scoped
 * @param parameters The configuration of the role
 * @returns The role resource
 */
export declare function defineProjectRole(projectId: string, parameters: BlueprintRoleConfig): BlueprintProjectRoleResource;
/**
 * Creates a reference to a role in another stack.
 *
 * ```ts
 * referenceRole({
 *   name: 'editor-role',
 *   stack: 'editorial',
 * })
 * ```
 *
 * @public
 * @beta Referencing Roles via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Referencers
 * @expandType BlueprintCrossStackReferenceConfig
 * @param params The parameters for referencing the role
 * @returns The role reference
 */
export declare function referenceRole({ name, stack, localName }: BlueprintCrossStackReferenceConfig): BlueprintResource;

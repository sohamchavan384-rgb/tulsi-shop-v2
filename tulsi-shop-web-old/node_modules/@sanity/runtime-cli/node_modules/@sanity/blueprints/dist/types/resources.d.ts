/**
 * Define deployment behaviour once the policy has been deployed. The following behaviours are allowed:
 *
 *  - **retain** If a stack is destroyed, the resource is detached from the stack and will not be destroyed. If the resource is removed from the blueprint, deployment will fail.
 *  - **replace** if a stack is deployed, the resource will be destroyed and created instead of performing an update. If the resource is removed from the blueprint, it will be destroyed. If the stack is destroyed, the resource will be destroyed.
 *  - **allow** if a stack is destroyed, the resource will be destroyed along with it. If the resource is removed it will be destroyed
 *  - **protect** if a stack is deployed the resource will not be updated. If the resource is removed from the blueprint or the stack is destroyed, deployment will fail.
 * @category Blueprint Internals
 */
export type BlueprintResourceDeletionPolicy = 'allow' | 'retain' | 'replace' | 'protect';
/**
 * An ownership action that will cause the referenced resource to be attached to the current stack.
 * @category Blueprint Internals
 */
export interface BlueprintOwnershipAttachAction {
    type: 'attach';
    /** The identifier of the resource to be attached to the current stack */
    id: string;
}
/**
 * An ownership action that will cause the referenced resource to be detached from the current stack.
 * @category Blueprint Internals
 */
export interface BlueprintOwnershipDetachAction {
    type: 'detach';
}
/**
 * An ownership action that will cause the resource to be read during deployment so it can be referenced
 * by other resources. Note that referenced resources must be in the same project or organization as the
 * current stack.
 * @category Blueprint Internals
 */
export interface BlueprintOwnershipReferenceAction {
    type: 'reference';
    /** The name or id of the stack where the resource is attached */
    stack: string;
    /** The name of the resource to be referenced */
    name: string;
}
/**
 * A union of all possible ownership actions.
 * @category Blueprint Internals
 * @expand
 */
export type BlueprintOwnershipAction = BlueprintOwnershipAttachAction | BlueprintOwnershipDetachAction | BlueprintOwnershipReferenceAction;
/**
 * An ownership action that will cause the referenced project-contained resource to be attached to the current stack.
 * @category Blueprint Internals
 */
export interface BlueprintProjectOwnershipAttachAction extends BlueprintOwnershipAttachAction {
    /** The identifier of the project for resources contained in a project */
    projectId: string;
}
/**
 * A union of all possible ownership actions for resources belonging to projects.
 * @category Blueprint Internals
 * @expand
 */
export type BlueprintProjectOwnershipAction = BlueprintProjectOwnershipAttachAction | BlueprintOwnershipDetachAction | BlueprintOwnershipReferenceAction;
/**
 * Defines the lifcycle policy for this resource.
 * @category Blueprint Internals
 */
export interface BlueprintResourceLifecycle {
    deletionPolicy?: BlueprintResourceDeletionPolicy;
    ownershipAction?: BlueprintOwnershipAction;
    /**
     * Declares a dependency on another resource in the blueprint.
     * The referenced resource will be deployed before this one.
     *
     * The value must be a resource reference starting with `$.resources.` followed by the name of
     * the resource this resource depends on.
     *
     * @example
     * ```ts
     * lifecycle: {
     *   dependsOn: '$.resources.my-dataset',
     * }
     * ```
     */
    dependsOn?: string;
}
/**
 * Defines the lifcycle policy for this resource.
 * @category Blueprint Internals
 * @experimental
 */
export interface BlueprintProjectResourceLifecycle extends BlueprintResourceLifecycle {
    ownershipAction?: BlueprintProjectOwnershipAction;
}
/**
 * The base type for all resources.
 * @category Blueprint Internals
 */
export interface BlueprintResource<Lifecycle extends BlueprintResourceLifecycle = BlueprintResourceLifecycle> {
    /** The type of the resource. e.g. 'sanity.project.webhook' */
    type: string;
    /** The name of the resource. Unique within the blueprint. e.g. 'sync-webhook' */
    name: string;
    /**
     * Defines the lifcycle policy for this resource.
     * @experimental
     * @hidden
     */
    lifecycle?: Lifecycle;
}
/**
 * The configuration for referencing a resource in another stack.
 * @category Blueprint Internals
 */
export interface BlueprintCrossStackReferenceConfig {
    /** The name of the resource in the other stack */
    name: string;
    /** The name or id of the stack being referenced */
    stack: string;
    /** The local name of the resource, defaults to the name of the other resource */
    localName?: string;
}
/**
 * The configuration for referencing a resource in another stack including the type of resource.
 * @category Blueprint Internals
 */
export interface BlueprintCrossStackReferenceResourceConfig extends BlueprintCrossStackReferenceConfig {
    /** The type of resource being referenced (e.g. `sanity.project`) */
    type: string;
}

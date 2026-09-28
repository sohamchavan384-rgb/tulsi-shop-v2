import { type BlueprintCrossStackReferenceConfig, type BlueprintProjectConfig, type BlueprintProjectResource, type BlueprintResource } from '../index.js';
/**
 * Defines a project.
 *
 * ```ts
 * defineProject({
 *   name: 'my-project',
 *   displayName: 'My Project',
 * })
 * ```
 * @param parameters The project configuration
 * @public
 * @beta Deploying Projects via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Definers
 * @expandType BlueprintProjectConfig
 * @returns The project resource
 * @hidden
 */
export declare function defineProject(parameters: BlueprintProjectConfig): BlueprintProjectResource;
/**
 * Creates a reference to a project in another stack.
 *
 * ```ts
 * referenceProject({
 *   name: 'editorial-project',
 *   stack: 'editorial',
 * })
 * ```
 *
 * @param params The parameters for referencing the project
 * @public
 * @beta Referencing Projects via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Referencers
 * @returns The project reference
 * @hidden
 */
export declare function referenceProject({ name, stack, localName }: BlueprintCrossStackReferenceConfig): BlueprintResource;

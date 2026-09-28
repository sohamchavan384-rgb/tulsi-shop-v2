import { type BlueprintCrossStackReferenceResourceConfig, type BlueprintResource } from '../index.js';
/**
 * Defines a generic resource to be managed in Blueprints.
 *
 * @remarks
 * This is useful if the resource type does not yet have a `define*` function.
 *
 * ```ts
 * defineResource({
 *   name: 'my-resource',
 *   type: 'sanity.new.resource',
 * })
 * ```
 * @param resourceConfig The resource configuration
 * @category Definers
 * @expandType BlueprintResource
 * @internal
 */
export declare function defineResource(resourceConfig: Partial<BlueprintResource>): BlueprintResource;
/**
 * Creates a reference to a resource in another stack
 * @param params The parameters for referencing the resource
 * @category Definers
 * @expandType BlueprintCrossStackReferenceResourceConfig
 * @internal
 */
export declare function referenceResource({ name, type, stack, localName }: BlueprintCrossStackReferenceResourceConfig): BlueprintResource;

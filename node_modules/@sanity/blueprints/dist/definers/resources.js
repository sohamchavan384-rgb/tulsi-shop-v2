import { assertResource } from '../index.js';
/*
 * FUTURE example (move below @example when ready)
 * @example With lifecycle
 * ```ts
 * defineResource({
 *   name: 'my-resource',
 *   type: 'sanity.new.resource',
 *   lifecycle: {deletionPolicy: 'retain'},
 * })
 * ```
 */
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
export function defineResource(resourceConfig) {
    const resource = {
        ...resourceConfig,
    };
    assertResource(resource);
    return resource;
}
/**
 * Creates a reference to a resource in another stack
 * @param params The parameters for referencing the resource
 * @category Definers
 * @expandType BlueprintCrossStackReferenceResourceConfig
 * @internal
 */
export function referenceResource({ name, type, stack, localName }) {
    const resource = {
        type,
        name: localName || name,
        lifecycle: {
            ownershipAction: {
                type: 'reference',
                stack,
                name,
            },
        },
    };
    assertResource(resource);
    return resource;
}
//# sourceMappingURL=resources.js.map
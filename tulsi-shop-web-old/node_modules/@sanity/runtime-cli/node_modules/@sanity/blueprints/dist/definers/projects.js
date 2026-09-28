import { referenceResource, validateProject, } from '../index.js';
import { runValidation } from '../utils/validation.js';
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
export function defineProject(parameters) {
    // default project name
    const displayName = parameters.displayName || parameters.name;
    const projectResource = {
        ...parameters,
        displayName,
        type: 'sanity.project',
    };
    runValidation(() => validateProject(projectResource));
    return projectResource;
}
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
export function referenceProject({ name, stack, localName }) {
    return referenceResource({ name, stack, localName, type: 'sanity.project' });
}
//# sourceMappingURL=projects.js.map
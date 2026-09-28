import {type BlueprintError, validateResource} from '../index.js'

/**
 * Validates that the given resource is a valid Project.
 * @param resource The Project resource
 * @hidden
 * @category Validation
 * @returns A list of validation errors
 */
export function validateProject(resource: unknown): BlueprintError[] {
  if (!resource) return [{type: 'invalid_value', message: 'Project config must be provided'}]
  if (typeof resource !== 'object') return [{type: 'invalid_type', message: 'Project config must be an object'}]

  const errors: BlueprintError[] = validateResource(resource, {projectContained: false})

  if ('type' in resource && resource.type !== 'sanity.project') {
    errors.push({type: 'invalid_value', message: 'Project type must be `sanity.project`'})
  }

  return errors
}

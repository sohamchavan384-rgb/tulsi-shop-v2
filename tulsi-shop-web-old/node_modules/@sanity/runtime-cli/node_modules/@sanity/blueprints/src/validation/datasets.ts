import {type BlueprintError, validateResource} from '../index.js'

/**
 * Validates that the given resource is a valid Dataset.
 * @param resource The Dataset resource
 * @hidden
 * @category Validation
 * @returns A list of validation errors
 */
export function validateDataset(resource: unknown): BlueprintError[] {
  if (!resource) return [{type: 'invalid_value', message: 'Dataset config must be provided'}]
  if (typeof resource !== 'object') return [{type: 'invalid_type', message: 'Dataset config must be an object'}]

  const errors: BlueprintError[] = validateResource(resource, {projectContained: true})

  if ('type' in resource && resource.type !== 'sanity.project.dataset') {
    errors.push({type: 'invalid_value', message: 'Dataset type must be `sanity.project.dataset`'})
  }

  // validate description if provided
  if ('description' in resource) {
    if (typeof resource.description !== 'string') {
      errors.push({type: 'invalid_type', message: 'Dataset description must be a string'})
    }
  }

  // validate ACL mode if provided
  if ('aclMode' in resource) {
    if (typeof resource.aclMode !== 'string') {
      errors.push({type: 'invalid_type', message: 'Dataset aclMode must be one of `custom`, `public`, or `private`'})
    } else {
      const aclMode: string = resource.aclMode
      if (aclMode !== 'custom' && aclMode !== 'public' && aclMode !== 'private') {
        errors.push({type: 'invalid_value', message: 'Dataset aclMode must be one of `custom`, `public`, or `private`'})
      }
    }
  }

  // validate project if provided
  if ('project' in resource) {
    if (typeof resource.project !== 'string') {
      errors.push({type: 'invalid_type', message: 'Dataset project must be a string'})
    }
  }

  return errors
}

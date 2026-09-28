import type {BlueprintError, BlueprintResource} from '../index.js'
import {runValidation} from '../utils/validation.js'

/**
 * Validates that the given resource is a valid resource.
 * @param resource The resource
 * @param options Validation options
 * @internal
 * @returns A list of validation errors
 */
export function validateResource(resource: unknown, options?: {projectContained?: boolean}): BlueprintError[] {
  if (!resource) return [{type: 'invalid_value', message: 'Resource config must be provided'}]
  if (typeof resource !== 'object') return [{type: 'invalid_type', message: 'Resource config must be an object'}]

  const errors: BlueprintError[] = []

  if (!('name' in resource)) {
    errors.push({type: 'missing_parameter', message: '`name` is required'})
  } else if (typeof resource.name !== 'string') {
    errors.push({type: 'invalid_type', message: '`name` must be a string'})
  }

  if (!('type' in resource)) {
    errors.push({type: 'missing_parameter', message: '`type` is required'})
  } else if (typeof resource.type !== 'string') {
    errors.push({type: 'invalid_type', message: '`type` must be a string'})
  }

  if ('lifecycle' in resource) {
    if (typeof resource.lifecycle !== 'object' || resource.lifecycle === null) {
      errors.push({type: 'invalid_type', message: '`lifecycle` must be an object'})
    } else {
      if ('deletionPolicy' in resource.lifecycle) {
        if (typeof resource.lifecycle.deletionPolicy !== 'string') {
          errors.push({type: 'invalid_type', message: '`deletionPolicy` must be a string'})
        } else if (!['allow', 'retain', 'replace', 'protect'].includes(resource.lifecycle.deletionPolicy)) {
          errors.push({type: 'invalid_value', message: '`deletionPolicy` must be one of allow, retain, replace, protect'})
        }
      }

      if ('ownershipAction' in resource.lifecycle) {
        const ownershipActionTypes = ['attach', 'detach', 'reference']
        const ownershipAction = resource.lifecycle.ownershipAction

        if (typeof ownershipAction !== 'object' || ownershipAction === null) {
          errors.push({type: 'invalid_type', message: '`ownershipAction` must be an object'})
        } else if (!('type' in ownershipAction)) {
          errors.push({type: 'missing_parameter', message: '`ownershipAction.type` is required'})
        } else if (typeof ownershipAction.type !== 'string') {
          errors.push({type: 'invalid_type', message: '`ownershipAction.type` must be a string'})
        } else if (!ownershipActionTypes.includes(ownershipAction.type)) {
          errors.push({type: 'invalid_value', message: `\`ownershipAction.type\` must be one of ${ownershipActionTypes.join(', ')}`})
        } else {
          if (ownershipAction.type === 'attach') {
            if (!('id' in ownershipAction)) {
              errors.push({type: 'missing_parameter', message: '`ownershipAction.id` is required for attach'})
            } else if (typeof ownershipAction.id !== 'string') {
              errors.push({type: 'invalid_type', message: '`ownershipAction.id` must be a string'})
            }

            if (options?.projectContained) {
              if (!('projectId' in ownershipAction)) {
                errors.push({type: 'missing_parameter', message: '`ownershipAction.projectId` is required for attach'})
              } else if (typeof ownershipAction.projectId !== 'string') {
                errors.push({type: 'invalid_type', message: '`ownershipAction.projectId` must be a string'})
              }
            }
          } else if (ownershipAction.type === 'reference') {
            if (!('name' in ownershipAction)) {
              errors.push({type: 'missing_parameter', message: '`ownershipAction.name` is required for reference'})
            } else if (typeof ownershipAction.name !== 'string') {
              errors.push({type: 'invalid_type', message: '`ownershipAction.name` must be a string'})
            }

            if (!('stack' in ownershipAction)) {
              errors.push({type: 'missing_parameter', message: '`ownershipAction.stack` is required for reference'})
            } else if (typeof ownershipAction.stack !== 'string') {
              errors.push({type: 'invalid_type', message: '`ownershipAction.stack` must be a string'})
            }
          }
        }
      }

      if ('dependsOn' in resource.lifecycle) {
        if (typeof resource.lifecycle.dependsOn !== 'string') {
          errors.push({type: 'invalid_type', message: '`lifecycle.dependsOn` must be a string'})
        } else if (!resource.lifecycle.dependsOn.startsWith('$.resources.')) {
          errors.push({type: 'invalid_value', message: '`lifecycle.dependsOn` must be a resource reference starting with `$.resources.`'})
        }
      }
    }
  }

  return errors
}

/**
 * @param resource The resource
 * @internal
 * @returns The resource
 */
export function assertResource(resource: unknown): asserts resource is BlueprintResource {
  runValidation(() => validateResource(resource))
}

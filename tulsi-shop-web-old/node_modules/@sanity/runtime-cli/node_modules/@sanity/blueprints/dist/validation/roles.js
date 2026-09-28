import { validateResource } from '../index.js';
/**
 * Validates that the given resource is a valid Role.
 * @param resource The Role resource
 * @category Validation
 * @returns A list of validation errors
 */
export function validateRole(resource) {
    if (!resource)
        return [{ type: 'invalid_value', message: 'Role config must be provided' }];
    if (typeof resource !== 'object')
        return [{ type: 'invalid_type', message: 'Role config must be an object' }];
    const errors = validateResource(resource, { projectContained: true });
    if (!('name' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Role name is required' });
    }
    else if (typeof resource.name !== 'string') {
        errors.push({ type: 'invalid_type', message: 'Role name must be a string' });
    }
    if (!('type' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Role type is required' });
    }
    else if (resource.type !== 'sanity.access.role') {
        errors.push({ type: 'invalid_value', message: 'Role type must be `sanity.access.role`' });
    }
    if (!('title' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Role title is required' });
    }
    else if (typeof resource.title !== 'string') {
        errors.push({ type: 'invalid_type', message: 'Role title must be a string' });
    }
    else if (resource.title.length > 100) {
        errors.push({ type: 'invalid_value', message: 'Role title must be 100 characters or less' });
    }
    if (!('permissions' in resource) || !Array.isArray(resource.permissions) || resource.permissions.length < 1) {
        errors.push({ type: 'invalid_value', message: 'Role must have at least one permission' });
    }
    return errors;
}
/**
 * Validates that the given resource is a valid Project Role.
 * @param resource The Role resource
 * @category Validation
 * @returns A list of validation errors
 */
export function validateProjectRole(resource) {
    // validate the main part of the role resource
    const errors = validateRole(resource);
    // only do validation if resource is provided, otherwise just return the errors
    if (resource && typeof resource === 'object') {
        if (!('resourceType' in resource)) {
            errors.push({ type: 'missing_parameter', message: 'Role resource type must be `project`' });
        }
        else if (resource.resourceType !== 'project') {
            errors.push({ type: 'invalid_value', message: 'Role resource type must be `project`' });
        }
        if (!('resourceId' in resource)) {
            errors.push({ type: 'missing_parameter', message: 'Role resource ID is required' });
        }
        else if (typeof resource.resourceId !== 'string') {
            errors.push({ type: 'invalid_type', message: 'Role resource ID must be a string' });
        }
    }
    return errors;
}
//# sourceMappingURL=roles.js.map
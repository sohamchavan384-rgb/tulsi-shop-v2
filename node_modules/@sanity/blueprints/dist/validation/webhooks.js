import { validateResource } from '../index.js';
import { isReference } from '../utils/validation.js';
/**
 * Validates that the given resource is a valid Document Webhook.
 * @param resource The Document Webhook resource
 * @category Validation
 * @returns A list of validation errors
 */
export function validateDocumentWebhook(resource) {
    if (!resource)
        return [{ type: 'invalid_value', message: 'Webhook config must be provided' }];
    if (typeof resource !== 'object')
        return [{ type: 'invalid_type', message: 'Webhook config must be an object' }];
    const errors = validateResource(resource, { projectContained: true });
    if (!('name' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Webhook name is required' });
    }
    else if (typeof resource.name !== 'string') {
        errors.push({ type: 'invalid_type', message: 'Webhook name must be a string' });
    }
    if (!('type' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Webhook type is required' });
    }
    else if (resource.type !== 'sanity.project.webhook') {
        errors.push({ type: 'invalid_value', message: 'Webhook type must be `sanity.project.webhook`' });
    }
    if ('displayName' in resource) {
        if (typeof resource.displayName !== 'string') {
            errors.push({ type: 'invalid_type', message: 'Display name must be a string' });
        }
        else if (resource.displayName.length > 100) {
            errors.push({ type: 'invalid_value', message: 'Display name must be 100 characters or less' });
        }
    }
    if (!('url' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Webhook URL is required' });
    }
    else if (typeof resource.url !== 'string') {
        errors.push({ type: 'invalid_type', message: 'Webhook URL must be a string' });
    }
    else if (!isReference(resource.url)) {
        try {
            new URL(resource.url);
        }
        catch {
            errors.push({ type: 'invalid_value', message: 'Webhook URL must be a valid URL' });
        }
    }
    if (!('on' in resource) || !Array.isArray(resource.on) || resource.on.length === 0) {
        errors.push({ type: 'invalid_value', message: 'At least one event type must be specified in the "on" field' });
    }
    else {
        // Validate event types
        const validEvents = ['create', 'update', 'delete'];
        if (resource.on) {
            const invalidEvents = resource.on.filter((event) => !validEvents.includes(event));
            if (invalidEvents.length > 0) {
                errors.push({
                    type: 'invalid_value',
                    message: `Invalid event types: ${invalidEvents.join(', ')}. Valid events are: ${validEvents.join(', ')}`,
                });
            }
        }
    }
    // Validate dataset pattern
    if (!('dataset' in resource)) {
        errors.push({ type: 'missing_parameter', message: 'Webhook dataset is required' });
    }
    else if (typeof resource.dataset !== 'string') {
        errors.push({ type: 'invalid_format', message: 'Dataset must be a string' });
    }
    else if (!isReference(resource.dataset) && !/^[a-z0-9-_]+$/.test(resource.dataset)) {
        errors.push({ type: 'invalid_format', message: 'Dataset must match pattern: ^[a-z0-9-_]+$' });
    }
    // Validate HTTP method
    if ('httpMethod' in resource) {
        const validMethods = ['POST', 'PUT', 'PATCH', 'DELETE', 'GET'];
        const message = `Invalid HTTP method: ${resource.httpMethod}. Valid methods are: ${validMethods.join(', ')}`;
        if (typeof resource.httpMethod !== 'string') {
            errors.push({ type: 'invalid_type', message });
        }
        else {
            if (!validMethods.includes(resource.httpMethod)) {
                errors.push({
                    type: 'invalid_value',
                    message,
                });
            }
        }
    }
    // Validate status
    if ('status' in resource) {
        const message = 'Status must be either "enabled" or "disabled"';
        if (typeof resource.status !== 'string') {
            errors.push({ type: 'invalid_type', message });
        }
        else if (!['enabled', 'disabled'].includes(resource.status)) {
            errors.push({ type: 'invalid_value', message });
        }
    }
    // Validate headers pattern
    if ('headers' in resource) {
        if (typeof resource.headers !== 'object' || !resource.headers || Array.isArray(resource.headers)) {
            errors.push({ type: 'invalid_type', message: 'Webhook headers must be an object' });
        }
        else {
            const headerNamePattern = /^[a-zA-Z][a-zA-Z0-9-_]*$/;
            for (const [key, value] of Object.entries(resource.headers)) {
                if (!headerNamePattern.test(key)) {
                    errors.push({ type: 'invalid_format', message: `Header key "${key}" must match pattern: ${headerNamePattern.source}` });
                }
                if (typeof value !== 'string') {
                    errors.push({ type: 'invalid_type', message: `Header value for "${key}" must be a string` });
                }
            }
        }
    }
    return errors;
}
//# sourceMappingURL=webhooks.js.map
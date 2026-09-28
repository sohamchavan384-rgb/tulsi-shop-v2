import type { BlueprintProjectResourceLifecycle, BlueprintResource } from '../index.js';
/**
 * Types of events that can trigger a webhook
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export type WebhookTrigger = 'create' | 'update' | 'delete';
/**
 * A webhook resource definition
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 */
export interface BlueprintDocumentWebhookResource extends BlueprintResource<BlueprintProjectResourceLifecycle> {
    type: 'sanity.project.webhook';
    project?: string;
    /**
     * Display name shown in the Sanity dashboard
     * @defaultValue The `name` of the resource
     */
    displayName?: string;
    description?: string | null;
    url: string;
    on: WebhookTrigger[];
    filter?: string;
    projection?: string;
    status?: 'enabled' | 'disabled';
    httpMethod?: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';
    headers?: Record<string, string>;
    includeDrafts?: boolean;
    includeAllVersions?: boolean;
    secret?: string;
    dataset: string;
    /** Must start with 'v' and use the format YYYY-MM-DD */
    apiVersion: string;
}
/**
 * Configuration for a webhook
 * @beta This feature is subject to breaking changes.
 * @category Resource Types
 * @interface
 */
export type BlueprintDocumentWebhookConfig = Omit<BlueprintDocumentWebhookResource, 'type'>;

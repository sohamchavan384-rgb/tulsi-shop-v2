import { type BlueprintDocumentWebhookConfig, type BlueprintDocumentWebhookResource } from '../index.js';
/**
 * Defines a webhook that is called when document changes occur.
 *
 * ```ts
 * defineDocumentWebhook({
 *   name: 'my-webhook',
 *   on: ['create'],
 *   url: 'https://example.com/webhook',
 *   projection: '{_id}',
 *   dataset: 'production',
 *   apiVersion: 'v2026-01-01',
 * })
 * ```
 * @param parameters The webhook configuration
 * @public
 * @beta Deploying Webhooks via Blueprints is experimental. This feature is stabilizing but may still be subject to breaking changes.
 * @category Definers
 * @expandType BlueprintDocumentWebhookConfig
 * @returns The webhook resource
 */
export declare function defineDocumentWebhook(parameters: BlueprintDocumentWebhookConfig): BlueprintDocumentWebhookResource;

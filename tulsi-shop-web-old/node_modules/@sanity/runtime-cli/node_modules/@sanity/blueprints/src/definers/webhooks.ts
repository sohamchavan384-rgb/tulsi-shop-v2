import {type BlueprintDocumentWebhookConfig, type BlueprintDocumentWebhookResource, validateDocumentWebhook} from '../index.js'
import {runValidation} from '../utils/validation.js'

/*
 * FUTURE example (move below @example when ready)
 * @example All options
 * ```ts
 * defineDocumentWebhook({
 *   name: 'sync-webhook',
 *   url: 'https://example.com/sync',
 *   on: ['create', 'update', 'delete'],
 *   dataset: 'production',
 *   apiVersion: 'v2026-01-01',
 *   filter: "_type == 'product'",
 *   projection: '{_id, title, slug}',
 *   httpMethod: 'POST',
 *   headers: {'X-Custom-Header': 'value'},
 *   secret: 'my-webhook-secret',
 *   includeDrafts: false,
 *   status: 'enabled',
 * })
 * ```
 */
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
export function defineDocumentWebhook(parameters: BlueprintDocumentWebhookConfig): BlueprintDocumentWebhookResource {
  // default the display name
  if (!parameters.displayName) {
    parameters.displayName = parameters.name.substring(0, 100)
  }

  const webhookResource: BlueprintDocumentWebhookResource = {
    ...parameters,
    type: 'sanity.project.webhook',
  }

  runValidation(() => validateDocumentWebhook(webhookResource))

  return webhookResource
}

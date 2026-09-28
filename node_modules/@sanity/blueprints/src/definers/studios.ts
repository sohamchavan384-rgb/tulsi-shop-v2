import {validateStudio} from '../index.js'
import type {BlueprintStudioConfig, BlueprintStudioResource} from '../types/studios.js'
import {runValidation} from '../utils/validation.js'

/**
 * Defines a studio.
 *
 * ```ts
 * defineStudio({
 *   name: 'my-studio',
 *   project: 'my-project-id',
 *   src: 'studios/my-studio',
 *   autoUpdates: {
 *     enabled: true
 *   }
 * })
 * ```
 * @param parameters The studio configuration
 * @public
 * @beta Deploying Studios via Blueprints is experimental. This may be subject to breaking changes.
 * @category Definers
 * @expandType BlueprintStudioConfig
 * @returns The studio resource
 * @hidden
 */
export function defineStudio(config: BlueprintStudioConfig): BlueprintStudioResource {
  const autoUpdates: BlueprintStudioResource['autoUpdates'] = {enabled: config.autoUpdates?.enabled ?? true}
  if (config.autoUpdates?.version !== undefined) {
    autoUpdates.version = config.autoUpdates.version
  }

  const studioResource: BlueprintStudioResource = {
    ...config,
    slug: config.slug || config.name,
    title: config.title || config.name,
    autoUpdates,
    type: 'sanity.studio',
  }

  runValidation(() => validateStudio(studioResource))

  return studioResource
}

import {
  type BlueprintMediaLibraryAssetFunctionConfig,
  type BlueprintMediaLibraryAssetFunctionResource,
  type BlueprintMediaLibraryFunctionResourceEvent,
  validateMediaLibraryAssetFunction,
} from '../../index.js'
import {runValidation} from '../../utils/validation.js'
import {BASE_EVENT_KEYS} from './base-event.js'
import {defineFunction} from './index.js'

type MediaLibraryFunctionEventKey = keyof BlueprintMediaLibraryFunctionResourceEvent
const MEDIA_LIBRARY_EVENT_KEYS = new Set<MediaLibraryFunctionEventKey>(['resource', ...BASE_EVENT_KEYS.values()])
/*
 * FUTURE example (move below @example when ready)
 * @example With robot token reference
 * ```ts
 * defineRobotToken({
 *   name: 'media-robot',
 *   memberships: [{
 *     resourceType: 'project',
 *     resourceId: projectId,
 *     roleNames: ['editor'],
 *   }],
 * })
 *
 * defineMediaLibraryAssetFunction({
 *   name: 'process-uploads',
 *   src: 'functions/process-uploads-v2',
 *   robotToken: '$.resources.media-robot',
 *   event: {
 *     on: ['create', 'update'],
 *     resource: {
 *       type: 'media-library',
 *       id: 'my-media-library-id',
 *     },
 *     filter: "type == 'image'",
 *     projection: "{_id}",
 *   },
 *   env: {
 *     CDN_BUCKET: 'my-cdn-bucket',
 *   },
 * })
 * ```
 */
/**
 * Defines a function that is triggered by media library events.
 *
 * ```ts
 * defineMediaLibraryAssetFunction({
 *   name: 'my-media-library-function',
 *   event: {
 *     on: ['create'],
 *     resource: {
 *       type: 'media-library',
 *       id: 'my-media-library-id',
 *     },
 *   },
 * })
 * ```
 * @param functionConfig The configuration for the media library asset function
 * @public
 * @category Definers
 * @expandType BlueprintMediaLibraryAssetFunctionConfig
 * @returns The validated media library asset function resource
 */
export function defineMediaLibraryAssetFunction(
  functionConfig: BlueprintMediaLibraryAssetFunctionConfig,
): BlueprintMediaLibraryAssetFunctionResource {
  const {event} = functionConfig

  const functionResource: BlueprintMediaLibraryAssetFunctionResource = {
    ...defineFunction(functionConfig, {skipValidation: true}),
    type: 'sanity.function.media-library.asset',
    event: buildMediaLibraryFunctionEvent(event),
  }

  runValidation(() => validateMediaLibraryAssetFunction(functionResource))

  return functionResource
}

/**
 * Builds a media library function event configuration.
 * Filters out non-event properties and applies defaults.
 * @param event Media library function event configuration
 * @returns Complete media library function event configuration
 */
function buildMediaLibraryFunctionEvent(event: BlueprintMediaLibraryFunctionResourceEvent): BlueprintMediaLibraryFunctionResourceEvent {
  const cleanEvent = Object.fromEntries(
    Object.entries(event).filter(([key]) => MEDIA_LIBRARY_EVENT_KEYS.has(key as MediaLibraryFunctionEventKey)),
  ) as BlueprintMediaLibraryFunctionResourceEvent

  const fullEvent = {
    on: cleanEvent.on || ['publish'],
    ...cleanEvent,
  }
  return fullEvent
}

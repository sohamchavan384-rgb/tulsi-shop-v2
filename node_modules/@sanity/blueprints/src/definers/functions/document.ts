import {
  type BlueprintDocumentFunctionConfig,
  type BlueprintDocumentFunctionResource,
  type BlueprintDocumentFunctionResourceEvent,
  validateDocumentFunction,
} from '../../index.js'
import {runValidation} from '../../utils/validation.js'
import {BASE_EVENT_KEYS} from './base-event.js'
import {defineFunction} from './index.js'

type DocumentFunctionEventKey = keyof BlueprintDocumentFunctionResourceEvent
const DOCUMENT_EVENT_KEYS = new Set<DocumentFunctionEventKey>(['includeAllVersions', 'resource', ...BASE_EVENT_KEYS.values()])

/*
 * FUTURE example (move below @example when ready)
 * @example With robot token reference
 * ```ts
 * defineRole({
 *   name: 'fn-role',
 *   title: 'Function Role',
 *   appliesToRobots: true,
 *   permissions: [{name: 'sanity-project-dataset', action: 'read'}],
 * })
 *
 * defineRobotToken({
 *   name: 'fn-robot',
 *   memberships: [{
 *     roleNames: ['$.resources.fn-role'],
 *   }],
 * })
 *
 * defineDocumentFunction({
 *   name: 'sync-to-external',
 *   src: 'functions/sync',
 *   memory: 3,
 *   timeout: 300,
 *   robotToken: '$.resources.fn-robot',
 *   event: {
 *     on: ['create', 'update'],
 *     filter: "_type == 'product'",
 *     projection: "{_id, title, slug}",
 *     includeDrafts: false,
 *   },
 *   env: {
 *     EXTERNAL_API_URL: 'https://api.example.com',
 *     SUPER_SECRET: process.env.SUPER_SECRET,
 *   },
 * })
 * ```
 */
/**
 * Defines a function that is triggered by document events in Sanity datasets.
 *
 * ```ts
 * defineDocumentFunction({
 *   name: 'my-document-function',
 *   event: {
 *     on: ['create', 'update'],
 *     filter: "_type == 'post'",
 *     projection: "{_id, title, slug}",
 *   },
 * })
 * ```
 * @param functionConfig The configuration for the document function
 * @public
 * @category Definers
 * @expandType BlueprintDocumentFunctionConfig
 * @returns The validated document function resource
 */
export function defineDocumentFunction(functionConfig: BlueprintDocumentFunctionConfig): BlueprintDocumentFunctionResource
/**
 * @deprecated Define event properties under the 'event' key instead of specifying them at the top level
 * @hidden
 */
export function defineDocumentFunction(
  functionConfig: BlueprintDocumentFunctionConfig & Partial<BlueprintDocumentFunctionResourceEvent>,
): BlueprintDocumentFunctionResource

export function defineDocumentFunction(
  functionConfig: BlueprintDocumentFunctionConfig & Partial<BlueprintDocumentFunctionResourceEvent>,
): BlueprintDocumentFunctionResource {
  let {name, src, event, timeout, memory, env, robotToken, project, runtime, ...maybeEvent} = functionConfig

  // event validation and normalization
  if (event) {
    // `event` was specified, but event keys (aggregated in `maybeEvent`) were also specified at the top level. ambiguous and deprecated usage.
    const duplicateKeys = Array.from(DOCUMENT_EVENT_KEYS).filter((key) => key in maybeEvent)
    if (duplicateKeys.length > 0) {
      throw new Error(
        `\`event\` properties should be specified under the \`event\` key - specifying them at the top level is deprecated. The following keys were specified at the top level: ${duplicateKeys.map((k) => `\`${k}\``).join(', ')}`,
      )
    }

    event = buildDocumentFunctionEvent(event)
  } else {
    event = buildDocumentFunctionEvent(maybeEvent)
    // deprecated usage of putting event properties at the top level, warn about this.
    console.warn(
      '⚠️ Deprecated usage of `defineDocumentFunction`: prefer to put `event` properties under the `event` key rather than at the top level.',
    )
  }

  const functionResource: BlueprintDocumentFunctionResource = {
    ...defineFunction(functionConfig, {skipValidation: true}),
    type: 'sanity.function.document',
    event,
  }

  runValidation(() => validateDocumentFunction(functionResource))

  return functionResource
}

/**
 * Builds a document function event configuration from partial event properties.
 * Filters out non-event properties and applies defaults.
 * @param event Partial document function event configuration
 * @returns Complete document function event configuration
 */
function buildDocumentFunctionEvent(event: Partial<BlueprintDocumentFunctionResourceEvent>): BlueprintDocumentFunctionResourceEvent {
  const cleanEvent = Object.fromEntries(
    Object.entries(event).filter(([key]) => DOCUMENT_EVENT_KEYS.has(key as DocumentFunctionEventKey)),
  ) as Partial<BlueprintDocumentFunctionResourceEvent>

  return {
    on: cleanEvent.on || ['publish'],
    ...cleanEvent,
  }
}

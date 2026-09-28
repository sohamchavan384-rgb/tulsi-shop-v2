import type {BlueprintResource} from '../../index.js'
import type {
  BlueprintDocumentFunctionResourceEvent,
  BlueprintFunctionResourceContentLakeEvent,
  BlueprintMediaLibraryFunctionResourceEvent,
  BlueprintScheduledFunctionConfigEvent,
  BlueprintScheduledFunctionResourceEvent,
  BlueprintSyncTagInvalidateFunctionResourceEvent,
} from './event.js'
import type {IanaTimezone} from './timezone.js'

export * from './event.js'

/**
 * Supported Function runtimes
 * @category Functions Types
 */
export const VALID_RUNTIMES = ['node', 'nodejs22.x', 'nodejs24.x'] as const
/**
 * Supported function runtimes
 * @category Functions Types
 */
export type FunctionRuntimes = (typeof VALID_RUNTIMES)[number]

// --- Function Resource (Output) Types: `define*Function` method return types ---

/**
 * Base function resource with common properties for all function types
 * @category Functions Types
 */
interface BlueprintCommonFunctionResource extends BlueprintResource {
  /** Human-readable display name for the function */
  displayName?: string
  /** Path to the function source code */
  src: string
  /** Execution timeout in seconds */
  timeout?: number
  /** Memory allocation in gigabytes */
  memory?: number
  /** Environment variables provided to the function */
  env?: Record<string, string>
  /** Token provided during function invocation */
  robotToken?: string

  /**
   * The runtime environment for the function (currently only Node.js is supported)
   * @defaultValue 'nodejs24.x'
   */
  runtime?: FunctionRuntimes
}

/**
 * Configuration used for Queue or Workflow function types.
 * @todo: not implemented
 * @category Functions Types
 * @alpha
 * @hidden
 */
interface QueueConfig {
  /**
   * Maximum number of concurrent invocations in progress from queue to Function
   * @todo: not implemented, what is the default anyways?
   */
  concurrency?: number
  /**
   * Debounce window in seconds
   * @todo: not implemented - and should this always be provided with debounceKey?
   */
  debounce?: number
  /**
   * Path used to group debounced events, e.g. 'document._id'
   * @todo: not implemented - and should this always be provided with debounce window?
   */
  debounceKey?: string
  /**
   * Whether to place messages that failed processing into a Dead Letter Queue.
   * @todo: not implemented
   * @default `false`
   */
  dlq?: boolean
  /**
   * By default, queues employ at-least once delivery. When set to `true`, employs first-in-first-out ordering and exactly-once delivery.
   * FIFO queues have a lower transaction-per-second limit.
   * @todo: not implemented
   * @default `false`
   */
  fifo?: boolean
}

/**
 * Base function resource with common properties for all function types that can belong to projects.
 * @category Functions Types
 */
export interface BlueprintBaseFunctionResource extends BlueprintCommonFunctionResource {
  /**
   * The project ID of the project that contains your function.
   *
   * The `project` attribute must be defined if your blueprint is scoped to an organization. */
  project?: string
}

/**
 * A function resource triggered by document events in Sanity datasets
 * @category Functions Types
 */
export interface BlueprintDocumentFunctionResource extends BlueprintBaseFunctionResource {
  type: 'sanity.function.document'
  /** Event configuration specifying when and how the function is triggered */
  event: BlueprintDocumentFunctionResourceEvent
}

/**
 * A function resource triggered by media library asset events
 * @category Functions Types
 */
export interface BlueprintMediaLibraryAssetFunctionResource extends BlueprintBaseFunctionResource {
  type: 'sanity.function.media-library.asset'
  /** Event configuration specifying when and how the function is triggered */
  event: BlueprintMediaLibraryFunctionResourceEvent
}

/**
 * A function resource triggered by scheduled events
 * @category Functions Types
 */
export interface BlueprintScheduledFunctionResource extends BlueprintCommonFunctionResource {
  type: 'sanity.function.cron'
  event: BlueprintScheduledFunctionResourceEvent
  timezone?: IanaTimezone
}

/**
 * A function resource triggered by sync tag invalidate events
 * @category Functions Types
 */
export interface BlueprintSyncTagInvalidateFunctionResource extends BlueprintBaseFunctionResource {
  type: 'sanity.function.sync-tag-invalidate'
  event?: BlueprintSyncTagInvalidateFunctionResourceEvent
}

/**
 * A function resource triggered by sync tag invalidate events
 * @category Functions Types
 * @alpha
 * @hidden
 */
export interface BlueprintQueueFunctionResource extends BlueprintBaseFunctionResource, QueueConfig {
  type: 'sanity.function.queue'
  /** Optional Content Lake event source that triggers the function */
  event?: BlueprintFunctionResourceContentLakeEvent
}

/**
 * A function resource triggered by another function
 * @category Functions Types
 */
export interface BlueprintPubSubFunctionResource extends BlueprintBaseFunctionResource {
  type: 'sanity.function.pubsub'
}

/**
 * A durable, step-based function.
 * @alpha Deploying Durable Functions via Blueprints is experimental. This feature is not available publicly yet.
 * @hidden
 * @category Functions Types
 */
export interface BlueprintDurableFunctionResource extends BlueprintBaseFunctionResource, QueueConfig {
  type: 'sanity.function.durable'
  event?: BlueprintFunctionResourceContentLakeEvent
}

// --- Function Config (Input) Types: : `define*Function` method parameter types ---

/**
 * Configuration for defining a base function.
 * @internal
 * @category Functions Types
 * @interface
 */
export type BlueprintBaseFunctionConfig = Omit<BlueprintBaseFunctionResource, 'type' | 'src'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
}

/**
 * Configuration for defining a document function.
 * @public
 * @category Functions Types
 * @interface
 */
export type BlueprintDocumentFunctionConfig = Omit<BlueprintDocumentFunctionResource, 'type' | 'src' | 'event'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
  /**
   * Event configuration specifying when and how the function is triggered
   * @defaultValue `{on: ['publish']}`
   */
  event?: BlueprintDocumentFunctionResourceEvent
}

/**
 * Configuration for defining a media library asset function.
 * @public
 * @category Functions Types
 * @interface
 */
export type BlueprintMediaLibraryAssetFunctionConfig = Omit<BlueprintMediaLibraryAssetFunctionResource, 'type' | 'src'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
}

/**
 * Configuration for defining a scheduled function.
 * @public
 * @category Functions Types
 * @interface
 */
export type BlueprintScheduledFunctionConfig = Omit<BlueprintScheduledFunctionResource, 'type' | 'src' | 'event'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
  /**
   * Event configuration specifying when the function is triggered
   */
  event: BlueprintScheduledFunctionConfigEvent
}

/**
 * Configuration for defining a sync tag invalidate function.
 * @public
 * @category Functions Types
 * @interface
 */
export type BlueprintSyncTagInvalidateFunctionConfig = Omit<BlueprintSyncTagInvalidateFunctionResource, 'type' | 'src'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
}

/**
 * Configuration for defining a queue function.
 * @public
 * @alpha Deploying Queue Functions via Blueprints is experimental. This feature is not available publicly yet.
 * @hidden
 * @category Functions Types
 * @interface
 */
export type BlueprintQueueFunctionConfig = Omit<BlueprintQueueFunctionResource, 'type' | 'src' | 'event'> &
  QueueConfig & {
    /**
     * Path to the function source code
     * @defaultValue `functions/${name}`
     */
    src?: string

    /** Optional event configuration that triggers the queue function */
    event?: BlueprintFunctionResourceContentLakeEvent
  }

/**
 * Configuration for defining an event function.
 * @public
 * @category Functions Types
 * @interface
 */
export type BlueprintPubSubFunctionConfig = Omit<BlueprintPubSubFunctionResource, 'type' | 'src'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
}

/**
 * Configuration for defining a durable function.
 * @public
 * @alpha Deploying Durable Functions via Blueprints is experimental. This feature is not available publicly yet.
 * @hidden
 * @category Functions Types
 * @interface
 */
export type BlueprintDurableConfig = Omit<BlueprintDurableFunctionResource, 'type' | 'src' | 'event'> & {
  /**
   * Path to the function source code
   * @defaultValue `functions/${name}`
   */
  src?: string
  /**
   * Trigger configuration
   */
  event?: BlueprintFunctionResourceContentLakeEvent
}

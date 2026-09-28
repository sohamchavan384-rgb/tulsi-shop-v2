// --- Function Event Types ---

/**
 * Base event configuration shared by document and media library function types
 * @category Functions Types
 */
export interface BlueprintFunctionBaseResourceEvent {
  /**
   * Event types that trigger the function
   * @defaultValue ['publish']
   */
  on?: [BlueprintFunctionResourceEventName, ...BlueprintFunctionResourceEventName[]]
  /** GROQ filter expression to match specific documents (e.g., "_type == 'post'") */
  filter?: string
  /** GROQ projection to specify which fields to include (e.g., "{_id, title, slug}") */
  projection?: `{${string}}`
  /** Include draft documents in addition to published documents */
  includeDrafts?: boolean
}

/**
 * Event configuration for document functions
 * @category Functions Types
 */
export interface BlueprintDocumentFunctionResourceEvent extends BlueprintFunctionBaseResourceEvent {
  /** Include all versions of documents, not just the current version */
  includeAllVersions?: boolean
  /** Optional dataset resource scoping for the function */
  resource?: BlueprintFunctionResourceEventResourceDataset
}

/**
 * Event configuration for media library asset functions
 * @category Functions Types
 */
export interface BlueprintMediaLibraryFunctionResourceEvent extends BlueprintFunctionBaseResourceEvent {
  /** Media library resource scoping (required for media library functions) */
  resource: BlueprintFunctionResourceEventResourceMediaLibrary
}

/**
 * Event configuration for sync tag invalidate functions
 * @category Functions Types
 */
export interface BlueprintSyncTagInvalidateFunctionResourceEvent {
  /** Optional dataset resource scoping for the function */
  resource?: BlueprintFunctionResourceEventResourceDataset
}

/**
 * Explicit resource event for scheduled functions to specific minutes, hours, days of month, months, and days of week
 * @example { minute: '0', hour: '9', dayOfMonth: '1', month: '1', dayOfWeek: '1' }
 * @category Functions Types
 */
export interface BlueprintScheduledFunctionExplicitResourceEvent {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

/**
 * Expression resource for scheduled functions to specific expressions
 * @example { expression: '0 9 * * *' }
 * @category Functions Types
 */
export interface BlueprintScheduledFunctionExpressionResourceEvent {
  expression: string
}

/**
 * Union type of all scheduled function resource events
 * @category Functions Types
 */
export type BlueprintScheduledFunctionResourceEvent = BlueprintScheduledFunctionExplicitResourceEvent

/**
 * Union type of all scheduled function resource event configurations
 * @category Functions Types
 */
export type BlueprintScheduledFunctionConfigEvent =
  | BlueprintScheduledFunctionExplicitResourceEvent
  | BlueprintScheduledFunctionExpressionResourceEvent

/**
 * Union type of all Content Lake event source configurations
 * @category Functions Types
 */
export type BlueprintFunctionResourceContentLakeEvent =
  | ({type: 'document'} & BlueprintDocumentFunctionResourceEvent)
  | ({type: 'media-library'} & BlueprintMediaLibraryFunctionResourceEvent)
  | ({type: 'sync-tag-invalidate'} & BlueprintSyncTagInvalidateFunctionResourceEvent)

/**
 * Dataset resource for scoping document functions to specific datasets
 * @example { type: 'dataset', id: 'my-project.production' }
 * @category Functions Types
 */
export interface BlueprintFunctionResourceEventResourceDataset {
  type: 'dataset'
  /** A dataset ID in the format <projectId>.<datasetName>. <datasetName> can be `*` to signify "all datasets in project with ID <projectId>." */
  id: string
}

/**
 * Media library resource for scoping media library functions
 * @category Functions Types
 */
export interface BlueprintFunctionResourceEventResourceMediaLibrary {
  type: 'media-library'
  id: string
}

/**
 * Events that can trigger a function
 * @category Functions Types
 */
export type BlueprintFunctionResourceEventName = 'publish' | 'create' | 'delete' | 'update'

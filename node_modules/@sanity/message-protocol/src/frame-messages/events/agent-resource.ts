import type {Message} from '@sanity/comlink'

/**
 * Context resource data that apps can emit to update the Agent's understanding
 * of what the user is currently interacting with.
 * @public
 */
export interface AgentResourceContext extends Record<string, unknown> {
  /**
   * The project ID of the current context
   */
  projectId: string
  /**
   * The dataset of the current context
   */
  dataset: string
  /**
   * Optional document ID if the user is viewing/editing a specific document
   */
  documentId?: string
}

/**
 * Message sent from embedded apps to update the Agent's resource context.
 * This allows the Agent to understand what resource the user is currently
 * interacting with (e.g., which document they're editing).
 * @public
 */
export interface AgentResourceUpdateMessage extends Message {
  type: 'dashboard/v1/events/agent/resource/update'
  data: AgentResourceContext
}

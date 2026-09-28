import type {Message} from '@sanity/comlink'

/**
 * Used to notify the platform that the document metadata has changed.
 * @public
 */
export interface DocumentChangeMessage extends Message {
  type: 'dashboard/v1/bridge/listeners/document-change'
  data: {
    title: string
  }
  response: {
    success: boolean
  }
}

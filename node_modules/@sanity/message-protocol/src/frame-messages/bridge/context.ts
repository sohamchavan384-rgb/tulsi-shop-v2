import type {Message} from '@sanity/comlink'

import type {Context_v1} from '../context'

/**
 * @public
 * @deprecated Use `Context_v1` instead.
 */
export type BridgeContext = Context_v1

/**
 * Message sent from the bridge to fetch
 * the context of the current application
 * @public
 * @deprecated Use `FrameMessages.ContextMessage` instead.
 */
export interface ContextMessage extends Message {
  type: 'dashboard/v1/bridge/context'
  response: {
    context: BridgeContext
  }
}

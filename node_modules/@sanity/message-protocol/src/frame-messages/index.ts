import type * as Auth from './auth'
import type * as Bridge from './bridge'
import type {ContextMessage_v1} from './context'
import type * as Events from './events'

/**
 * @public
 */
export type FrameMessages =
  | Bridge.Listeners.History.UpdateURLMessage
  | Bridge.Listeners.Document.DocumentChangeMessage
  | Bridge.Navigation.NavigateToResourceMessage
  | Bridge.Context.ContextMessage
  | Events.AgentResourceUpdateMessage
  | Events.FavoriteMessage
  | Events.HistoryMessage
  | Events.WebVitalsMessage
  | ContextMessage_v1
  | Auth.Tokens.CreateTokenMessage
  | Auth.Access.RequestAccessMessage

export type * as Auth from './auth'
export type * as Bridge from './bridge'
export type {Context_v1, ContextMessage_v1} from './context'
export type * as Events from './events'

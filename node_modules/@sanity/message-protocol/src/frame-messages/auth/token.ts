import type {Message} from '@sanity/comlink'

/**
 * Used to fetch a new token for the current application.
 * @public
 */
export interface CreateTokenMessage extends Message {
  type: 'dashboard/v1/auth/tokens/create'
  response: {
    token: string
  }
}

import type {Message} from '@sanity/comlink'

/**
 * Envoke the access request prompt for a given resource.
 * @public
 */
export interface RequestAccessMessage extends Message {
  type: 'dashboard/v1/auth/access/request'
  data: {
    resourceType: 'organization' | 'project' | 'application'
    resourceId: string
  }
  response: {success: true} | {success: false; message: string}
}

import type {EncodableObject, Encoded, ID} from './encoder'

/**
 *
 * @public
 */
export type SynchronizationRequest = {
  /** The root ID of the descriptor being synchronized. */
  id: ID

  /** A set of descriptors. */
  descriptors?: Array<Encoded<string, EncodableObject>>
}

/**
 * The result from a server which supports descriptor synchronization.
 *
 * @public
 */
export type SynchronizationResult = SynchronizationResultComplete | SynchronizationResultIncomplete

/**
 * SynchronizationResultComplete is returned from a synchronization server when
 * the requested descriptor has been completely synchronized.
 *
 * @public
 */
export type SynchronizationResultComplete = {
  type: 'complete'
}

/**
 * SynchronizationResponseIncomplete is returned from a synchronization server
 * when it needs more descriptors.
 *
 * @public
 */
export type SynchronizationResultIncomplete = {
  type: 'incomplete'

  /**
   * A list of descriptor IDs which must be sent to the server (in a new
   * request). This is not guaranteeed to be the _full_ set of missing
   * descriptors.
   **/
  missingIds: string[]
}

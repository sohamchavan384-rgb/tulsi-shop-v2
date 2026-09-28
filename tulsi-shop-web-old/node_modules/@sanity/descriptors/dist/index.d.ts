/**
 * Represents a set of Uint8Array's which are all of the same size.
 * The primary interface is the `toggle` method which either adds or removes
 * a value to the set.
 *
 * @beta
 */
declare class BufferSet {
  arr: Uint8Array
  byteSize: number
  length: number
  capacity: number
  constructor(byteSize: number, capacity: number)
  toggle(val: Uint8Array | number[]): void
  forEach(fn: (val: Uint8Array) => void): void
  /**
   * Returns a normalized JSON representation.
   *
   * This is not optimized and should mainly be used for debugging.
   */
  toJSON(): number[][]
}

/**
 * Decodes a base64 value encoded using multibase.
 *
 * @public
 */
export declare function decodeBase64(input: string, into: Uint8Array): void

/**
 * A JavaScript object which can be encoded as a descriptor.
 * @public
 */
export declare type EncodableObject = {
  [key: string]: EncodableValue | undefined
}

/**
 * The subset of values which we can encode.
 *
 * @public
 */
export declare type EncodableValue =
  | EncodableObject
  | Array<EncodableValue>
  | boolean
  | string
  | null

/**
 * Encodes an object with the given type.
 *
 * @public
 */
export declare function encode<Type extends string, Props extends EncodableObject>(
  type: Type,
  props: Props,
  options?: {
    /**
     * This is invoked with the raw SHA256 hash, which will also be placed in
     * `id` in encoded form.
     **/
    withDigest?: (digest: Uint8Array) => void
    /**
     * A map of objects that will be rewritten.
     * Any of the keys that are seen will be replaced with the value.
     */
    rewriteMap?: Map<EncodableValue, EncodableValue>
  },
): Encoded<Type, Props>

/**
 * Encodes binary data into the base64url format as specified by multibase:
 * https://github.com/multiformats/multibase.
 *
 * @public
 */
export declare function encodeBase64(data: Uint8Array, prefix?: string): string

/**
 * Encodes a SHA256 hash (which should be 32 bytes long) as specified by multihash:
 * https://github.com/multiformats/multihash.
 *
 * @public
 */
export declare function encodeBase64Sha256(data: Uint8Array): string

/**
 * A descriptor with an `id` and `type`.
 *
 * @public
 */
export declare type Encoded<T extends string, U extends EncodableObject = EncodableObject> = U & {
  id: ID
  type: T
}

/**
 * A set descriptor. This follows the very specific form with a property called
 * `keys` containing other descriptor IDs.
 *
 * @public
 */
export declare type EncodedSet<Type extends string> = Encoded<
  Type,
  {
    keys: ID[]
  }
>

/** The ID if a descriptor. */
declare type ID = string

/**
 * The main logic for synchronizing a set to a server.
 *
 * Initially this function should be invoked with `prevResult` set to `null`.
 * This returns a SynchronizationRequest which should then be sent to a server.
 * Once the server returns a result this function should be invoked with this
 * as a parameter. This proccess should be continued until this function return
 * `null`.
 *
 * @param sync The set to synchronize.
 * @param prevResult The result from the previous synchronization.
 * @returns `null` when the synchronization is complete, or a request which should be sent.
 * @public
 */
export declare function processSetSynchronization<Type extends string>(
  sync: SetSynchronization<Type>,
  prevResult: SynchronizationResult | null,
): SynchronizationRequest | null

/**
 * SetBuilder is a class which helps you construct a set for efficient synchronization.
 *
 * @public
 */
export declare class SetBuilder {
  private objectValues
  private setValues
  private keys
  private sketch
  private rewriteMap
  constructor({rewriteMap}?: SetBuilderOptions)
  /**
   * Add an object to the set.
   */
  addObject<Type extends string>(type: Type, obj: EncodableObject): void
  /**
   * Add another set to the set.
   */
  addSet<Type extends string>(sync: SetSynchronization<Type>): void
  build<Type extends string>(type: Type): SetSynchronization<Type>
}

declare type SetBuilderOptions = {
  /**
   * See {@link encode}
   */
  rewriteMap?: Map<EncodableObject, EncodableObject>
}

/**
 * A sketch of a set of n-byte objects (als sometimes called "invertible Bloom
 * filter"). It supports the following operation:
 *
 * - `construct`: Create a sketch with a given number of buckets (i.e.
 *   capacity).
 * - `toggle`: Add/remove (depending on whether it already existed) a value into
 *   the sketch.
 * - `toggleAll`: Add/remove all the values from _another_ sketch.
 * - `decode`: Attempt to recover the values inside the set. This should succeed
 *   with a high probability if the set currently contains ~80% of the number of
 *   buckets it was constructed with.
 *
 * The typical use case is to use this to construct two different sketches, each
 * could contain hundreds or thousands entries, and then by invoking `toggleAll`
 * between these sketches it's possible to decode the symmetric difference
 * between the sets.
 *
 * This is an implementation of https://doi.org/10.4230/LIPIcs.ICALP.2024.20.
 *
 * @internal
 */
export declare class SetSketch {
  arr: Uint8Array
  byteSize: number
  numBuckets: number
  constructor(byteSize: number, numBuckets: number)
  toggle(val: Uint8Array | number[], yieldBucket?: (bucket: number) => void): void
  toggleAll(other: SetSketch): void
  copy(): SetSketch
  decode(): BufferSet | null
  looksPure(bucket: number): boolean
}

/**
 * SetSynchronization contains information about a set so that it can be
 * synchronized.
 *
 * @public
 */
export declare interface SetSynchronization<Type extends string> {
  /** @internal */
  set: EncodedSet<Type>
  /** @internal */
  digest: Uint8Array
  /** @internal */
  objectValues: Record<string, Encoded<string, EncodableObject>>
  /** @internal */
  setValues: Record<string, SetSynchronization<string>>
  /** @internal */
  sketch: SetSketch
}

/**
 *
 * @public
 */
export declare type SynchronizationRequest = {
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
declare type SynchronizationResult = SynchronizationResultComplete | SynchronizationResultIncomplete
export {SynchronizationResult as SynchronizationResponse}
export {SynchronizationResult}

/**
 * SynchronizationResultComplete is returned from a synchronization server when
 * the requested descriptor has been completely synchronized.
 *
 * @public
 */
declare type SynchronizationResultComplete = {
  type: 'complete'
}
export {SynchronizationResultComplete as SynchronizationResponseSuccess}
export {SynchronizationResultComplete}

/**
 * SynchronizationResponseIncomplete is returned from a synchronization server
 * when it needs more descriptors.
 *
 * @public
 */
declare type SynchronizationResultIncomplete = {
  type: 'incomplete'
  /**
   * A list of descriptor IDs which must be sent to the server (in a new
   * request). This is not guaranteeed to be the _full_ set of missing
   * descriptors.
   **/
  missingIds: string[]
}
export {SynchronizationResultIncomplete as SynchronizationResponseIncomplete}
export {SynchronizationResultIncomplete}

export {}

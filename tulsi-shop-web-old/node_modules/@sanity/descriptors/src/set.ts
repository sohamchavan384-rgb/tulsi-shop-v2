import {type EncodableObject, encode, type Encoded, type ID} from './encoder'
import {SetSketch} from './reconciler'
import type {SynchronizationRequest, SynchronizationResult} from './sync'

/**
 * A set descriptor. This follows the very specific form with a property called
 * `keys` containing other descriptor IDs.
 *
 * @public
 */
export type EncodedSet<Type extends string> = Encoded<Type, {keys: ID[]}>

/**
 * SetSynchronization contains information about a set so that it can be
 * synchronized.
 *
 * @public
 */
export interface SetSynchronization<Type extends string> {
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

export type SetBuilderOptions = {
  /**
   * See {@link encode}
   */
  rewriteMap?: Map<EncodableObject, EncodableObject>
}

/**
 * SetBuilder is a class which helps you construct a set for efficient synchronization.
 *
 * @public
 */
export class SetBuilder {
  private objectValues: Record<string, Encoded<string, EncodableObject>> = {}
  private setValues: Record<string, SetSynchronization<string>> = {}
  private keys: string[] = []
  private sketch: SetSketch = new SetSketch(32, 8)
  private rewriteMap: Map<EncodableObject, EncodableObject> | undefined

  constructor({rewriteMap}: SetBuilderOptions = {}) {
    this.rewriteMap = rewriteMap
  }

  /**
   * Add an object to the set.
   */
  addObject<Type extends string>(type: Type, obj: EncodableObject): void {
    const value = encode(type, obj, {
      withDigest: (digest) => {
        this.sketch.toggle(digest)
      },
      rewriteMap: this.rewriteMap,
    })
    this.objectValues[value.id] = value
    this.keys.push(value.id)
  }

  /**
   * Add another set to the set.
   */
  addSet<Type extends string>(sync: SetSynchronization<Type>): void {
    this.setValues[sync.set.id] = sync
    this.sketch.toggle(sync.digest)
    this.keys.push(sync.set.id)
  }

  build<Type extends string>(type: Type): SetSynchronization<Type> {
    this.keys.sort()

    let digest: Uint8Array

    const set = encode(
      type,
      {keys: this.keys},
      {
        withDigest: (d) => {
          digest = d
        },
      },
    )

    return {
      set,
      digest: digest!,
      objectValues: this.objectValues,
      setValues: this.setValues,
      sketch: this.sketch,
    }
  }
}

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
export function processSetSynchronization<Type extends string>(
  sync: SetSynchronization<Type>,
  prevResult: SynchronizationResult | null,
): SynchronizationRequest | null {
  const id = sync.set.id
  if (!prevResult) return {id}

  if (prevResult.type === 'complete') return null

  const descriptors: Array<Encoded<string, EncodableObject>> = []

  for (const missingId of prevResult.missingIds) {
    const descriptor = findDescriptor(sync, missingId)
    if (!descriptor) throw new Error(`Synchronization server is requested an unknonwn descriptor`)
    descriptors.push(descriptor)
  }

  return {id, descriptors}
}

function findDescriptor<Type extends string>(
  sync: SetSynchronization<Type>,
  id: ID,
): Encoded<string, EncodableObject> | null {
  if (sync.set.id === id) return sync.set

  const desc = sync.objectValues[id]
  if (desc) return desc

  for (const child of Object.values(sync.setValues)) {
    const childDesc = findDescriptor(child, id)
    if (childDesc) return childDesc
  }

  return null
}

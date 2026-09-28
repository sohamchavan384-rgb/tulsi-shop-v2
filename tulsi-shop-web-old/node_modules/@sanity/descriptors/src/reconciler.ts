import {arrayCompare, arrayEquals, arrayZero} from './utils'

const NUM_HASH = 3

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
export class SetSketch {
  arr: Uint8Array
  byteSize: number
  numBuckets: number

  constructor(byteSize: number, numBuckets: number) {
    if (numBuckets >= 31) throw new Error('numBuckets must be less than 31')

    this.byteSize = byteSize
    this.numBuckets = numBuckets
    this.arr = new Uint8Array(this.byteSize * this.numBuckets)
  }

  toggle(val: Uint8Array | number[], yieldBucket?: (bucket: number) => void): void {
    for (let k = 0; k < NUM_HASH; k++) {
      const bucket = val[k] % this.numBuckets
      if (yieldBucket) yieldBucket(bucket)

      const offset = bucket * this.byteSize
      for (let idx = 0; idx < this.byteSize; idx++) {
        this.arr[offset + idx] ^= val[idx]
      }
    }
  }

  toggleAll(other: SetSketch): void {
    for (let i = 0; i < this.arr.length; i++) {
      this.arr[i] ^= other.arr[i]
    }
  }

  copy(): SetSketch {
    const result = new SetSketch(this.byteSize, this.numBuckets)
    for (let idx = 0; idx < this.arr.length; idx++) {
      result.arr[idx] = this.arr[idx]
    }
    return result
  }

  decode(): BufferSet | null {
    const max = this.numBuckets * 2
    const set = new BufferSet(this.byteSize, max)
    const queue = new BitQueue(this.numBuckets)

    let t = 0

    while (!queue.isEmpty()) {
      const bucket = queue.pop()
      if (this.looksPure(bucket)) {
        if (t >= max) {
          // It's possible for the algorithm to be stuck in a loop so we guard this here.
          return null
        }

        const offset = bucket * this.byteSize

        // OPT: Maybe we could avoid copying here.
        const slice = this.arr.slice(offset, offset + this.byteSize)

        set.toggle(slice)
        this.toggle(slice, (otherBuckets) => {
          if (otherBuckets !== bucket) {
            queue.set(otherBuckets)
          }
        })

        t++
      }
    }

    if (!arrayZero(this.arr)) return null

    return set
  }

  looksPure(bucket: number): boolean {
    const offset = bucket * this.byteSize
    const val = this.arr.subarray(offset, offset + this.byteSize)
    if (arrayZero(val)) return false

    let hashedToBucketCount = 0

    for (let k = 0; k < NUM_HASH; k++) {
      const hashedBucket = val[k] % this.numBuckets
      if (hashedBucket === bucket) hashedToBucketCount++
    }

    return hashedToBucketCount % 2 == 1
  }
}

/**
 * Represents a set of Uint8Array's which are all of the same size.
 * The primary interface is the `toggle` method which either adds or removes
 * a value to the set.
 *
 * @beta
 */
export class BufferSet {
  arr: Uint8Array
  byteSize: number
  length: number
  capacity: number

  constructor(byteSize: number, capacity: number) {
    this.arr = new Uint8Array(byteSize * capacity)
    this.byteSize = byteSize
    this.length = 0
    this.capacity = capacity
  }

  toggle(val: Uint8Array | number[]): void {
    for (let i = 0; i < this.length; i++) {
      const start = i * this.byteSize
      const slice = this.arr.subarray(start, start + this.byteSize)
      if (arrayEquals(val, slice)) {
        if (i != this.length - 1) {
          // Move the last entry into this slot.
          const lastEntryByteIdx = (this.length - 1) * this.byteSize
          for (let j = 0; j < this.byteSize; j++) {
            slice[j] = this.arr[lastEntryByteIdx + j]
          }
        }

        this.length--
        return
      }
    }

    if (this.length === this.capacity) throw new Error('BufferSet is full')

    const byteIdx = this.length * this.byteSize
    for (let i = 0; i < this.byteSize; i++) {
      this.arr[byteIdx + i] = val[i]
    }
    this.length++
  }

  forEach(fn: (val: Uint8Array) => void): void {
    for (let i = 0; i < this.length; i++) {
      const start = i * this.byteSize
      fn(this.arr.subarray(start, start + this.byteSize))
    }
  }

  /**
   * Returns a normalized JSON representation.
   *
   * This is not optimized and should mainly be used for debugging.
   */
  toJSON(): number[][] {
    const result: number[][] = []
    this.forEach((entry) => {
      result.push(Array.from(entry))
    })

    result.sort((a, b) => arrayCompare(a, b))
    return result
  }
}

/**
 * A queue which can store numbers in the range of [0, 32).The `set` method is
 * idempontent and will only add a value to the queue if it's not set there
 * already.
 *
 * It uses a single bitset to efficiently keep track of which values have
 * already been set.
 *
 * The construct defaults to putting all the numbers onto the queue.
 */
class BitQueue {
  bitset: number
  queue: number[]

  constructor(size: number) {
    // Set all bits to 1
    this.bitset = (1 << size) - 1
    this.queue = Array.from({length: size}, (_, i) => i)
  }

  set(idx: number) {
    const mask = 1 << idx
    if (this.bitset & mask) {
      // Already set. Nothing to do.
      return
    }

    this.queue.push(idx)
    this.bitset |= mask
  }

  isEmpty() {
    return this.bitset === 0
  }

  pop(): number {
    const idx = this.queue.shift()!
    const mask = 1 << idx
    this.bitset &= ~mask
    return idx
  }
}

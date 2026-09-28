import {Hash} from 'sha256-uint8array'
import {describe, expect, test} from 'vitest'

import {BufferSet, SetSketch} from './reconciler'

const A = [...new Hash().update('a').digest()]
const B = [...new Hash().update('b').digest()]
const SHA256_byteSize = 256 / 8 // 256-bit hashes

describe(SetSketch, () => {
  test('decode one value', () => {
    const sketch = new SetSketch(SHA256_byteSize, 8)
    sketch.toggle(A)

    const decoded = sketch.decode()
    expect(decoded).not.toBeNull()
    expect(decoded!.toJSON()).toEqual([A])
  })

  test('decode two values', () => {
    const sketch = new SetSketch(SHA256_byteSize, 8)
    sketch.toggle(A)
    sketch.toggle(B)

    const decoded = sketch.decode()
    expect(decoded).not.toBeNull()
    expect(decoded!.toJSON()).toEqual([B, A])
  })

  test('decode difference', () => {
    const sketch1 = new SetSketch(SHA256_byteSize, 8)
    const sketch2 = new SetSketch(SHA256_byteSize, 8)

    for (let i = 0; i < 50; i++) {
      const value = new Hash().update(new Uint8Array([i])).digest()
      sketch1.toggle(value)
      sketch2.toggle(value)
    }

    sketch1.toggle(A)
    sketch2.toggle(B)
    sketch1.toggleAll(sketch2)

    const decoded = sketch1.decode()
    expect(decoded).not.toBeNull()
    expect(decoded!.toJSON()).toEqual([B, A])
  })
})

describe(BufferSet, () => {
  test('set a single value', () => {
    const set = new BufferSet(4, 8)
    set.toggle([1, 2, 3, 4])

    expect(set.toJSON()).toEqual([[1, 2, 3, 4]])
  })

  test('set up until capacity', () => {
    const set = new BufferSet(4, 4)
    set.toggle([1, 2, 3, 4])
    set.toggle([2, 3, 4, 5])
    set.toggle([3, 4, 5, 6])
    set.toggle([4, 5, 6, 7])

    expect(() => {
      set.toggle([5, 6, 7, 8])
    }).toThrow()

    expect(set.toJSON()).toEqual([
      [1, 2, 3, 4],
      [2, 3, 4, 5],
      [3, 4, 5, 6],
      [4, 5, 6, 7],
    ])
  })

  test('unset last', () => {
    const set = new BufferSet(4, 4)
    set.toggle([1, 2, 3, 4])
    set.toggle([2, 3, 4, 5])
    set.toggle([2, 3, 4, 5])

    expect(set.toJSON()).toEqual([[1, 2, 3, 4]])
  })

  test('unset earlier', () => {
    const set = new BufferSet(4, 4)
    set.toggle([1, 2, 3, 4])
    set.toggle([2, 3, 4, 5])
    set.toggle([1, 2, 3, 4])

    expect(set.toJSON()).toEqual([[2, 3, 4, 5]])
  })
})

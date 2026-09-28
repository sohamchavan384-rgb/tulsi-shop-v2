import {describe, expect, it} from 'vitest'

import type {EncodableObject} from './encoder'
import {
  processSetSynchronization,
  SetBuilder,
  type SetBuilderOptions,
  type SetSynchronization,
} from './set'

function buildSync<Type extends string>(
  type: Type,
  fn: (builder: SetBuilder) => void,
  opts?: SetBuilderOptions,
): SetSynchronization<Type> {
  const builder = new SetBuilder(opts)
  fn(builder)
  return builder.build<Type>(type)
}

describe(processSetSynchronization.name, () => {
  const child = buildSync('test.set', (builder) => {
    builder.addObject('test.obj', {name: 'pears'})
  })

  const sync = buildSync('test.set', (builder) => {
    builder.addObject('test.obj', {name: 'hello'})
    builder.addObject('test.obj', {name: 'world'})
    builder.addSet(child)
  })

  it('requests minimally in the first request', () => {
    expect(processSetSynchronization(sync, null)).toEqual({id: sync.set.id})
  })

  it('returns null on succeess', () => {
    const request = processSetSynchronization(sync, {type: 'complete'})
    expect(request).toBeNull()
  })

  it('passes along the set if requesetd', () => {
    const request = processSetSynchronization(sync, {type: 'incomplete', missingIds: [sync.set.id]})
    expectNotNull(request)
    expect(request).toHaveProperty('descriptors')
    expect(request.descriptors).toEqual([sync.set])
  })

  it('passes along the child set if requested', () => {
    const request = processSetSynchronization(sync, {
      type: 'incomplete',
      missingIds: [child.set.id],
    })
    expectNotNull(request)
    expect(request).toHaveProperty('descriptors')
    expect(request.descriptors).toEqual([child.set])
  })

  it('passes along object values if requested', () => {
    // The top-level set contains two objects + one other set.
    // Remove the other set.

    const keys = sync.set.keys.filter((id) => id !== child.set.id)
    const request = processSetSynchronization(sync, {type: 'incomplete', missingIds: keys})
    expectNotNull(request)
    expect(request.descriptors).toEqual(keys.map((id) => sync.objectValues[id]))
  })

  it('passes along object values in child sets if requested', () => {
    const request = processSetSynchronization(sync, {
      type: 'incomplete',
      missingIds: child.set.keys,
    })
    expectNotNull(request)
    expect(request.descriptors).toEqual(child.set.keys.map((id) => child.objectValues[id]))
  })
})

describe(SetBuilder.name, () => {
  it('can rewrite objects', () => {
    const rewriteMap = new Map<EncodableObject, EncodableObject>()
    const bar1 = {bar: '1'}
    const bar2 = {bar: '2'}
    const bar3 = {bar: '3'}
    const bar4 = [bar1, bar2, bar3]
    rewriteMap.set(bar3, bar1)
    const sync = buildSync(
      'test.set',
      (b) => {
        b.addObject('test.obj', {bar1})
        b.addObject('test.obj', {bar2})
        b.addObject('test.obj', {bar3})
        b.addObject('test.obj', {bar3: bar1}) // duplicate
        b.addObject('test.obj', {bar4})
        b.addObject('test.obj', {bar4: [bar1, bar2, bar1]}) // duplicate
      },
      {rewriteMap},
    )

    const idsForThree: string[] = []

    // Note: We expect _4_ here since two of them are duplicate after the rewrite.
    expect(Object.entries(sync.objectValues)).toHaveLength(4)

    for (const [id, val] of Object.entries(sync.objectValues)) {
      if (typeof val['bar1'] === 'object') {
        expect(val['bar1']).toBe(bar1)
      } else if (typeof val['bar2'] === 'object') {
        expect(val['bar2']).toBe(bar2)
      } else if (typeof val['bar3'] === 'object') {
        // This has been rewritten:
        expect(val['bar3']).toBe(bar1)
        idsForThree.push(id)
      } else if (Array.isArray(val['bar4'])) {
        // This has been rewritten:
        expect(val['bar4']).toStrictEqual([bar1, bar2, bar1])
        expect(val['bar4'][0]).toBe(bar1)
        expect(val['bar4'][1]).toBe(bar2)
        expect(val['bar4'][2]).toBe(bar1)
      }
    }
  })
})

function expectNotNull<T>(val: T | null): asserts val is T {
  expect(val).not.toBeNull()
}

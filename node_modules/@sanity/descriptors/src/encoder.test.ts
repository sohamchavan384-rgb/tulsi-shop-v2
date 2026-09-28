import {describe, expect, test} from 'vitest'

import testDescriptors from './__fixtures__/descriptors.json'
import {type EncodableObject, encode, type Encoded} from './encoder'

describe('Fixtures', () => {
  test.each(
    [...Object.entries(testDescriptors as Record<string, Encoded<string>>)].filter(
      ([_, val]) => val['$invalid'] !== true,
    ),
  )('%s', (_, {id, type, ...restContent}) => {
    const encoded = encode(type, restContent)
    expect(encoded.id).toBe(id)
  })
})

describe('Regressions', () => {
  test('invalid descriptor ID with rewriteMap', () => {
    const makeTypeDef = (field: EncodableObject) => ({
      name: 'species',
      typeDef: {
        hello: undefined,
        extends: 'document',
        title: 'Species',
        fields: [field],
      },
    })

    const sourceField = {type: 'hello', name: 'world'}
    const hoisted = {__type: 'hoisted', key: 'book.author._ref'}

    const withSource = makeTypeDef(sourceField)
    const rewriteMap = new Map()
    rewriteMap.set(sourceField, hoisted)
    const result = encode('sanity.schema.namedType', withSource, {rewriteMap})

    const withHoisted = makeTypeDef(hoisted)
    const manuallyRewritten = encode('sanity.schema.namedType', withHoisted)

    expect(result).toStrictEqual(manuallyRewritten)
  })
})

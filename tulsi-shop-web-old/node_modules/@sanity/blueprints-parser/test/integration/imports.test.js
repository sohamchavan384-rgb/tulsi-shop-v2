import {describe, it} from 'node:test'
import blueprintParserValidator from '@sanity/blueprints-parser'

describe('module imports', () => {
  it('should import a function', (t) => {
    t.assert.equal(typeof blueprintParserValidator, 'function')
  })
})

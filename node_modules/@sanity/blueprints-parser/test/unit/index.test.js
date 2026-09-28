import {test} from 'node:test'
import schemas from '@sanity/blueprints-jsonschemas'
import Ajv from 'ajv/dist/2020.js'
import blueprintParserValidator from '../../src/index.js'
import mocks from '../mocks/all.js'

const ajv = new Ajv()

test('Basic input', async (t) => {
  t.plan(8)
  const input = {blueprintVersion: '2024-10-01'}
  const inputJSON = JSON.stringify(input)

  /** @type {import('../../src/index.js').BlueprintOutput} */
  let output

  output = blueprintParserValidator(input)
  t.assert.deepStrictEqual(
    output.result === 'valid' && output.blueprint,
    input,
    'Parser / validator accepted raw JS input',
  )
  t.assert.ok(!('errors' in output), 'Parser / validator found no issues')

  output = blueprintParserValidator(inputJSON)
  t.assert.deepStrictEqual(
    output.result === 'valid' && output.blueprint,
    input,
    'Parser / validator accepted JSON input',
  )
  t.assert.ok(!('errors' in output), 'Parser / validator found no issues')

  output = blueprintParserValidator(Buffer.from(inputJSON))
  t.assert.deepStrictEqual(
    output.result === 'valid' && output.blueprint,
    input,
    'Parser / validator accepted JSON buffer',
  )
  t.assert.ok(!('errors' in output), 'Parser / validator found no issues')

  output = blueprintParserValidator(input, {parameters: {ok: 'hello'}})
  t.assert.deepStrictEqual(
    output.result === 'valid' && output.blueprint,
    input,
    'Parser / validator accepted raw JS input and scalar params',
  )
  t.assert.ok(!('errors' in output), 'Parser / validator found no issues')
})

test('Basic input: errors', async (t) => {
  t.plan(10)
  const input = {blueprintVersion: 'nah'}
  const invalidInput = '{'
  const validInput = {}

  /** @type {import('../../src/index.js').BlueprintOutput} */
  let result

  result = blueprintParserValidator(invalidInput)
  t.assert.ok(result.result === 'parse_errors')
  t.assert.strictEqual(
    result.result === 'parse_errors' && result.errors.length,
    1,
    'Parser / validator returned error on invalid JSON',
  )

  result = blueprintParserValidator(undefined)
  t.assert.ok(result.result === 'parse_errors')
  t.assert.strictEqual(
    result.result === 'parse_errors' && result.errors.length,
    1,
    'Parser / validator returned error on invalid input (undefined)',
  )

  result = blueprintParserValidator(input)
  t.assert.ok(
    result.result === 'validation_errors',
    'Parser / validator accepted invalid raw JS input',
  )
  t.assert.strictEqual(
    result.result === 'validation_errors' && result.errors.length,
    1,
    'Parser / validator returned a basic format error',
  )

  // @ts-expect-error Passing invalid input to the parameters attribute
  result = blueprintParserValidator(validInput, {parameters: 'hi'})
  t.assert.ok(result.result === 'validation_errors', 'Parser / validator accepted result input')
  t.assert.strictEqual(
    result.result === 'validation_errors' && result.errors.length,
    1,
    'Parser / validator returned a basic format error',
  )

  // @ts-expect-error Passing invalid input to the parameters attribute
  result = blueprintParserValidator(validInput, {parameters: {ok: {}}})
  t.assert.ok(result.result === 'validation_errors', 'Parser / validator accepted result input')
  t.assert.strictEqual(
    result.result === 'validation_errors' && result.errors.length,
    1,
    'Parser / validator returned a basic format error',
  )
})

test('Reference resolution', async (t) => {
  const references = Object.entries(mocks.references)
  const referenceErrors = Object.entries(mocks.referenceErrors)
  const tests = references.length * 4 + referenceErrors.length * 5
  t.plan(tests)

  // Basic reference resolution
  for (const [name, {input, parameters, expected, unresolved}] of references) {
    const output = blueprintParserValidator(input, {
      debug: true,
      parameters,
    })
    t.assert.strictEqual(output.result, 'valid', `${name}: returned expected result`)
    if (output.result === 'valid') {
      const {blueprint, unresolvedRefs} = output
      t.assert.deepStrictEqual(blueprint, expected, `${name}: returned expected blueprint`)
      t.assert.deepStrictEqual(
        unresolvedRefs,
        unresolved,
        `${name}: returned expected unresolved references`,
      )
      t.assert.ok(!('errors' in output), `${name}: found no issues`)
    } else {
      t.assert.ok(!output.errors, `${name}: ${JSON.stringify(output.errors)}`)
    }
  }

  // Basic reference errors
  for (const [name, {options, input, expected, unresolved, error}] of referenceErrors) {
    const output = blueprintParserValidator(input, {
      debug: true,
      parameters: {},
      ...options,
    })
    t.assert.ok(output.result, 'result is true despite reference errors')
    if (output.result === 'reference_errors') {
      const {blueprint, unresolvedRefs, errors} = output
      t.assert.deepStrictEqual(blueprint, expected, `${name}: returned expected blueprint`)
      t.assert.deepStrictEqual(
        unresolvedRefs,
        unresolved,
        `${name}: returned expected unresolved references`,
      )
      t.assert.ok(errors && errors.length > 0, `${name}: parser / validator found an error`)
      if (error && errors && errors.length > 0) {
        t.assert.ok(
          errors.some((err) => err.type === error.type && err.message === error.message),
          JSON.stringify(errors),
        )
      } else {
        t.assert.ok(true) // makes planning easier
      }
    }
  }
})

test('2024-10-01', async (t) => {
  const jsonSchema20241001 = schemas['2024-10-01'].sanity.blueprint

  const basic = Object.entries(mocks.basic)
  const basicErrors = Object.entries(mocks.basicErrors)
  const tests =
    basic.length * 4 +
    // allow tests to opt out of JSON Schema validation, when it's not as flexible as regular logic
    basicErrors.reduce((a, [, b]) => a + (b.metadata?.ignore ? 1 : 3), 0)
  t.plan(tests)

  // Check the basic structure of a document
  for (const [name, input] of basic) {
    const output = blueprintParserValidator(input)
    t.assert.strictEqual(output.result, 'valid', `${name}: expected valid result`)
    t.assert.ok(!('errors' in output), `${name}: parser / validator found no issues`)
    if (output.result !== 'valid') console.log(`${name} errors:`, output.errors)

    const result = ajv.validate(jsonSchema20241001, input)
    t.assert.ok(result, `${name}: JSON Schema validator found no issues`)
    t.assert.ok(!ajv.errors, `${name}: JSON Schema validator found no issues`)
    if (ajv.errors?.length) console.log(`${name} errors (AJV):`, ajv.errors)
  }

  // Basic validation errors
  for (const [name, input] of basicErrors) {
    const output = blueprintParserValidator(input)
    t.assert.ok(
      output.result !== 'valid' && output.errors,
      `${name}: parser / validator found an error`,
    )

    if (!input.metadata?.ignore) {
      const result = ajv.validate(jsonSchema20241001, input)
      t.assert.ok(!result, `${name}: JSON Schema validator found an error`)
      t.assert.ok(ajv.errors, `${name}: JSON Schema validator found an error`)
    }
  }
})

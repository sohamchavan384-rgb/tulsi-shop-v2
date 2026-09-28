import is from './is.js'
import references from './refs.js'
import validate from './validate.js'

/**
 * Parses and validates the given input into a Blueprint object.
 * @param {import('./index.js').BlueprintInput} input
 * @param {import('./index.js').ParserOptions} options
 * @returns {import('./index.js').BlueprintOutput}
 */
export default function blueprintParserValidator(input, options = {}) {
  try {
    const parsedOutput = parse(input)
    if (parsedOutput.ok === false) {
      return {
        result: 'parse_errors',
        errors: parsedOutput.parseErrors,
      }
    }

    const parsedBlueprint = parsedOutput.rawBlueprint

    const validationResult = validate(parsedBlueprint, options)

    if (validationResult.ok === false) {
      return {
        result: 'validation_errors',
        errors: validationResult.errors,
      }
    }

    const validatedBlueprint = validationResult.blueprint

    const foundRefs = references.find(validatedBlueprint, options)
    if (!foundRefs.length) {
      return {
        result: 'valid',
        blueprint: validatedBlueprint,
      }
    }

    const {resolvedBlueprint, unresolvedRefs, refErrors} = references.resolve(
      validatedBlueprint,
      foundRefs,
      options,
    )

    /** @type {import('.').BlueprintOutput} */
    let output
    if (refErrors.length) {
      output = {
        result: 'reference_errors',
        blueprint: resolvedBlueprint,
        errors: refErrors,
      }
    } else {
      output = {
        result: 'valid',
        blueprint: resolvedBlueprint,
      }
    }
    if (unresolvedRefs?.length) output.unresolvedRefs = unresolvedRefs

    return output

    /* node:coverage ignore next 4 */
  } catch (error) {
    console.log('Unknown Blueprint error', error)
    throw error
  }
}

/**
 * Parse the raw input into a Blueprint object.
 * @param {import('.').BlueprintInput} input
 * @returns {import('.').ParserOuput}
 */
function parse(input) {
  if (is.string(input) || input instanceof Buffer) {
    try {
      const rawBlueprint = JSON.parse(input.toString())
      if (is.object(rawBlueprint)) {
        return {ok: true, rawBlueprint}
      }
    } catch (error) {
      return {
        ok: false,
        parseErrors: [
          {
            message: 'Invalid Blueprint JSON',
            type: 'json_validation_error',
            error,
          },
        ],
      }
    }
  } else if (is.object(input)) {
    const rawBlueprint = /** @type {Record<string, unknown>} */ (input)
    return {ok: true, rawBlueprint: structuredClone(rawBlueprint)}
  }
  return {
    ok: false,
    parseErrors: [
      {
        message: 'Invalid input',
        type: 'invalid_input',
      },
    ],
  }
}

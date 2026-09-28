import is from './is.js'
export default {find, resolve}

/**
 * @typedef {import('.').Blueprint} Blueprint
 * @typedef {import('.').ParserOptions} ParserOptions
 * @typedef {import('.').Reference} Reference
 * @typedef {import('.').UnresolvedReference} UnresolvedReference
 * @typedef {import('.').ReferenceError} ReferenceError
 * @typedef {import('.').ReferenceEndpoint} ReferenceEndpoint
 */

/**
 * @param {Blueprint} validatedBlueprint
 * @param {ParserOptions} options
 * @returns {Array<Reference>}
 */
function find(validatedBlueprint, options) {
  const {debug} = options
  /** @type {Array<Reference>} */
  const foundRefs = []

  /**
   * @param {*} item
   * @param {string} path
   */
  function walk(item, path) {
    if (is.object(item)) {
      for (const [name, value] of Object.entries(item)) {
        const cur = `${path}.${name}`
        if (is.ref(value)) foundRefs.push({path: cur, ref: value, container: item, property: name})
        else if (is.object(value) || is.array(value)) walk(value, cur)
      }
    }
    if (is.array(item)) {
      item.forEach((value, index) => {
        const cur = `${path}[${index}]`
        if (is.ref(value)) foundRefs.push({path: cur, ref: value, container: item, property: index})
        else if (is.object(value)) walk(value, cur)
      })
    }
  }

  // Top-level Blueprint properties that may contain a reference
  const properties = ['resources', 'parameters', 'outputs']
  for (const property of properties) {
    // Run over the list
    if (validatedBlueprint[property]?.length) {
      // Inspect each property, or (recursively) walk if it's an object
      for (const item of validatedBlueprint[property]) {
        const top = `${property}.${item.name}`
        walk(item, top)
      }
    }
  }

  /* node:coverage ignore next 4 */
  if (debug) {
    console.log(`[Debug] Found ${foundRefs.length} references:`, foundRefs.length ? foundRefs : '')
  }

  return foundRefs
}

/**
 * @param {Blueprint} blueprint
 * @param {Array<Reference>} foundRefs
 * @param {ParserOptions} options
 * @returns {{
 *   resolvedBlueprint: Blueprint
 *   unresolvedRefs: Array<UnresolvedReference> | undefined
 *   refErrors: Array<ReferenceError>
 * }}
 */
function resolve(blueprint, foundRefs, options) {
  const {parameters = {}, invalidReferenceTypes} = options

  /** @type {Record<string, Reference>} */
  const refs = {}
  /** @type {Array<UnresolvedReference>} */
  const unresolvedRefs = []
  const refErrors = []
  for (const foundRef of foundRefs) {
    const {ref} = foundRef
    const parts = ref.split('.')
    const refType = parts[1]
    const refName = parts[2]

    // Early return from an already found reference
    if (refs[ref]) {
      if (refType === 'resources') {
        // all resources references must be resolved during deployment
        unresolvedRefs.push(unresolvedReference(foundRef))
      } else {
        foundRef.container[foundRef.property] = refs[ref].container[refs[ref].property]
      }
      continue
    }

    refs[ref] = foundRef

    if (refType === 'parameters' || refType === 'params') {
      const param = parameters[refName]
      if (is.scalar(param)) {
        foundRef.container[foundRef.property] = param
      } else {
        refErrors.push({
          message: `Reference error '${ref}': '${refName}' not found in passed parameters`,
          type: 'missing_parameter',
        })
      }
    } else if (refType === 'values') {
      const value = blueprint.values?.[refName]
      if (is.scalar(value)) {
        foundRef.container[foundRef.property] = value
      } else {
        refErrors.push({
          message: `Reference error '${ref}': '${refName}' not found in blueprint values`,
          type: 'missing_value',
        })
      }
    } else if (refType === 'metadata' || refType === 'outputs') {
      refErrors.push({
        message: `Reference error '${ref}': invalid reference to ${refType}`,
        type: 'invalid_reference',
      })
    } else if (refType === 'blueprintVersion') {
      foundRef.container[foundRef.property] = blueprint.blueprintVersion
    } else if (refType === 'resources') {
      // check that the resource is in the list
      const found = blueprint.resources?.find((resource) => resource.name === refName)
      if (found) {
        // check if we allow references to the found resource's type
        if (invalidReferenceTypes?.includes(found.type)) {
          refErrors.push({
            message: `Reference error '${ref}': '${refName}' type '${found.type}' cannot be referenced`,
            type: 'invalid_reference',
          })
        } else {
          // all resources references must be resolved during deployment
          unresolvedRefs.push(unresolvedReference(foundRef))
        }
      } else {
        refErrors.push({
          message: `Reference error '${ref}': '${refName}' not found in blueprint resources`,
          type: 'missing_resource',
        })
      }
    } else {
      refErrors.push({
        message: `Reference error '${ref}': invalid reference type ${refType}`,
        type: 'invalid_reference',
      })
    }
  }

  return {
    resolvedBlueprint: blueprint,
    unresolvedRefs: unresolvedRefs.length ? unresolvedRefs : undefined,
    refErrors,
  }
}

/**
 * Create an unresolved reference from a found reference.
 * @param {Reference} foundRef
 * @returns {UnresolvedReference}
 */
function unresolvedReference(foundRef) {
  return {
    path: foundRef.path,
    ref: foundRef.ref,
    source: endpoint(foundRef.ref.slice(2)),
    target: endpoint(foundRef.path),
  }
}

/**
 * Create a reference endpoint from a location string.
 * @param {string} location
 * @returns {ReferenceEndpoint}
 */
function endpoint(location) {
  const [collection, name, ...path] = location.split('.')

  return {collection, name: name ?? '', path: path.join('.')}
}

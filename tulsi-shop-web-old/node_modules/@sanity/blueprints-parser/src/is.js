// Types
const array = (item) => Array.isArray(item)
// const bool = (item) => typeof item === 'boolean'
const defined = (item) => typeof item !== 'undefined'
// const nullish = (item) => typeof item === 'undefined' || item === null
const number = (item) => Number.isInteger(item) || (typeof item === 'number' && !Number.isNaN(item))
const object = (item) => !!item && typeof item === 'object' && !Array.isArray(item)
const ref = (item) => string(item) && item.startsWith('$.')
const scalar = (item) => string(item) || number(item)
const string = (item) => typeof item === 'string'

export default {
  array,
  defined,
  number,
  object,
  ref,
  scalar,
  string,
}

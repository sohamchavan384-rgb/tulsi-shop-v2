/**
 * GROQ language definition for Prism.js.
 *
 * Usage with Prism:
 *   import Prism from 'prismjs'
 *   import '@sanity/prism-groq'
 *   // or: import groq from '@sanity/prism-groq'
 *   //     Prism.languages.groq = groq
 *
 * Usage without Prism (standalone grammar):
 *   import groq from '@sanity/prism-groq'
 *   // groq is a plain object with token definitions
 */

const groq = {
  comment: {
    pattern: /\/\/.*/,
    greedy: true,
  },
  string: {
    pattern: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    greedy: true,
    inside: {
      escape: /\\(?:[\\/"'bfnrt]|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\})/,
    },
  },
  number: /(?<!\w)-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?(?!\w)/,
  boolean: /\b(?:false|true)\b/,
  null: /\bnull\b/,
  'keyword-operator': /\b(?:asc|desc|in|match)\b/,
  function:
    /\b(?:after|before|boost|coalesce|count|dateTime|defined|identity|length|lower|now|order|path|references|round|score|select|string|upper)\b(?=\s*\()/,
  'namespaced-call': {
    pattern: /\b[a-zA-Z_]\w*\s*::\s*[a-zA-Z_]\w*(?=\s*\()/,
    inside: {
      namespace: {
        pattern: /^[a-zA-Z_]\w*/,
        alias: 'class-name',
      },
      'namespace-separator': {
        pattern: /::/,
        alias: 'operator',
      },
      'namespaced-function': {
        pattern: /[a-zA-Z_]\w*$/,
        alias: 'function',
      },
    },
  },
  variable: /\$[a-zA-Z_]\w*/,
  'special-variable': {
    pattern: /@|\^+/,
    alias: 'variable',
  },
  wildcard: {
    pattern: /\*(?=\s*[\[{|])/,
    alias: 'variable',
  },
  spread: {
    pattern: /\.\.\./,
    alias: 'operator',
  },
  dereference: {
    pattern: /->/,
    alias: 'operator',
  },
  pipe: {
    pattern: /\|(?!\|)/,
    alias: 'operator',
  },
  operator: /=>|[!=<>]=|&&|\|\||[!+\-*/%]|\*\*|\.\.(?!\.)/,
  punctuation: /[[\]{}(),:;]/,
  accessor: {
    pattern: /\./,
    alias: 'punctuation',
  },
  identifier: /\b[a-zA-Z_]\w*\b/,
}

// Auto-register with Prism if available globally
if (
  typeof Prism !== 'undefined' &&
  typeof Prism.languages === 'object' &&
  Prism.languages !== null &&
  !Array.isArray(Prism.languages)
) {
  Prism.languages.groq = groq
}

export default groq

/**
 * Refractor/react-refractor compatible registration function.
 *
 * Usage:
 *   import {registerLanguage} from 'react-refractor'
 *   import {refractorGroq} from '@sanity/prism-groq'
 *   registerLanguage(refractorGroq)
 */
export const refractorGroq = Object.assign(
  /** @param {{languages: Record<string, unknown>}} prism */
  (prism) => {
    prism.languages.groq = groq
  },
  {displayName: 'groq', aliases: []},
)

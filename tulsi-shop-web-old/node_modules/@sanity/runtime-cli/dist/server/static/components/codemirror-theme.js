import {HighlightStyle, syntaxHighlighting, tags as t} from '../vendor/vendor.bundle.js'

const red = 'light-dark(var(--red-600), var(--red-400))'
// const orange = 'light-dark(var(--orange-600), var(--orange-400))'
const yellow = 'light-dark(var(--yellow-600), var(--yellow-400))'
const green = 'light-dark(var(--green-600), var(--green-400))'
const blue = 'light-dark(var(--blue-600), var(--blue-400))'
const magenta = 'light-dark(var(--magenta-600), var(--magenta-400))'
const purple = 'light-dark(var(--purple-600), var(--purple-400))'
const gray = 'light-dark(var(--gray-600), var(--gray-400))'
const text = 'light-dark(var(--gray-900), var(--gray-100))'

/// The highlighting style for code
export const sanityHighlightStyle = HighlightStyle.define([
  {tag: t.keyword, color: magenta},
  {tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: blue},
  {tag: [t.function(t.variableName), t.labelName], color: green},
  {tag: [t.color, t.constant(t.name), t.standard(t.name)], color: red},
  {tag: [t.definition(t.name), t.separator], color: purple},
  {
    tag: [
      t.typeName,
      t.className,
      t.number,
      t.changed,
      t.annotation,
      t.modifier,
      t.self,
      t.namespace,
    ],
    color: purple,
  },
  {
    tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: magenta,
  },
  {tag: [t.meta, t.comment], color: gray},
  {tag: t.strong, fontWeight: 'bold'},
  {tag: t.emphasis, fontStyle: 'italic'},
  {tag: t.strikethrough, textDecoration: 'line-through'},
  {tag: t.link, color: blue, textDecoration: 'underline'},
  {tag: t.heading, fontWeight: 'bold', color: blue},
  {tag: [t.atom, t.bool, t.special(t.variableName)], color: purple},
  {tag: [t.processingInstruction, t.string, t.inserted], color: yellow},
  {tag: t.invalid, color: text},
])

export const sanityCodeMirrorTheme = [syntaxHighlighting(sanityHighlightStyle)]

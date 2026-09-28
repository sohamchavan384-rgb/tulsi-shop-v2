# @sanity/prism-groq

[Prism.js](https://prismjs.com/) language definition for [GROQ](https://www.sanity.io/docs/groq) syntax highlighting.

## Install

```bash
npm install @sanity/prism-groq
```

## Usage with react-refractor

```tsx
import {Refractor, registerLanguage} from 'react-refractor'
import {refractorGroq} from '@sanity/prism-groq'

registerLanguage(refractorGroq)

function CodeBlock({query}: {query: string}) {
  return <Refractor language="groq" value={query} />
}
```

## Usage with Prism.js

```js
import Prism from 'prismjs'
import '@sanity/prism-groq'

const html = Prism.highlight(
  '*[_type == "post"]{title, "author": author->name}',
  Prism.languages.groq,
  'groq',
)
```

## Usage with refractor

```js
import {refractor} from 'refractor/core'
import {refractorGroq} from '@sanity/prism-groq'

refractor.register(refractorGroq)

const tree = refractor.highlight('*[_type == "post"]', 'groq')
```

## Standalone (no Prism dependency)

The grammar is a plain JavaScript object and can be used without Prism:

```js
import groq from '@sanity/prism-groq'
// groq.comment, groq.string, groq.function, etc.
```

## Tokens

| Token | Examples |
|---|---|
| `comment` | `// ...` |
| `string` | `"post"`, `'text'` |
| `string > escape` | `\n`, `\u0041`, `\u{1F600}` |
| `number` | `42`, `3.14`, `1e10` |
| `boolean` | `true`, `false` |
| `null` | `null` |
| `keyword-operator` | `in`, `match`, `asc`, `desc` |
| `function` | `count`, `defined`, `select`, `order`, ... |
| `namespace` | `math`, `pt`, `geo`, ... (before `::`) |
| `variable` | `$param` |
| `special-variable` | `@`, `^` |
| `wildcard` | `*` (everything selector) |
| `operator` | `==`, `!=`, `&&`, `\|\|`, `->`, `=>`, `\|`, ... |
| `spread` | `...` |
| `punctuation` | `[`, `]`, `{`, `}`, `(`, `)`, `,`, `:` |

## License

MIT

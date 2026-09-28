# @sanity/uuid

> [!WARNING]
> This package is no longer needed/encouraged - use `crypto.randomUUID()` or the `uuid` npm module directly.

Generate a valid Sanity document ID (uuid v4 format)

## Installation

```sh
$ npm install @sanity/uuid
// or
$ yarn add @sanity/uuid
```

## Usage

```js
import {uuid} from '@sanity/uuid'

const id = uuid()
console.log(id)
//=> 76dc5edf-9c43-4bab-a62d-4a2cad650053
```

## License

MIT © [Sanity.io](https://www.sanity.io/)

# @sanity/blueprints-parser

Parser and validator for Sanity Blueprints.

## Usage

```ts
import blueprintParserValidator from '@sanity/blueprints-parser'

const {blueprint, errors} = blueprintParserValidator(`{
  "resources": [
    {
      "name": "a-function",
      "type": "cloud-function",
      "project": "$.params.project"
    }
  ]
}`, {
  parameters: {
    project: "a-project"
  }
})
if (errors?.length) {
  for (const err of errors) {
    console.error(`${err.type}: ${err.message}`)
  }
}

console.log(blueprint.resources[0].name) // a-function
console.log(blueprint.resources[0].type) // cloud-function
console.log(blueprint.resources[0].project) // a-project
```
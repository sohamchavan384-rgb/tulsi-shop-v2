# `@sanity/blueprints`

> [!IMPORTANT]
> This package is currently in beta and may change. Refer to the [CHANGELOG](./CHANGELOG.md) for details.

TypeScript helpers for defining and validating [Sanity Blueprints](https://www.sanity.io/docs/blueprints) — declarative infrastructure-as-code for your Sanity project.

## Installation

```bash
npm install @sanity/blueprints
```

## Usage

A blueprint is a module that declares the Sanity resources your project needs. Export it as the default from your blueprint file:

```ts
import {
  defineBlueprint,
  defineCorsOrigin,
  defineDocumentFunction,
  defineDocumentWebhook,
  defineRobotToken,
  defineRole,
  defineWorkflow,
} from '@sanity/blueprints'

export default defineBlueprint({
  resources: [
    defineCorsOrigin({
      name: 'localhost-origin',
      origin: 'http://localhost:3333',
      allowCredentials: true,
    }),

    defineDocumentFunction({
      name: 'on-publish',
      event: {
        on: ['create', 'update'],
        filter: "_type == 'product'",
        projection: '{_id, title, slug}',
      },
    }),

    defineDocumentWebhook({
      name: 'server-webhook',
      url: 'https://api.example.com/webhooks/sanity',
      on: ['create', 'update'],
      dataset: 'production',
      apiVersion: 'v2026-01-01',
    }),

    defineRobotToken({
      name: 'ci-robot',
      memberships: [{
        resourceType: 'project',
        resourceId: 'your-project-id',
        roleNames: ['developer'],
      }],
    }),
  ],
})
```

## Available resources

| Definer | Description |
|---|---|
| `defineBlueprint` | Top-level blueprint module containing resources |
| `defineDocumentFunction` | Function triggered by document events |
| `defineMediaLibraryAssetFunction` | Function triggered by media library events |
| `defineCorsOrigin` β | CORS origin allowing browser requests to your project |
| `defineDocumentWebhook` β | Webhook triggered by document changes |
| `defineRole` β | Custom role with permissions |
| `defineRobotToken` β | Robot token for automated access |

Each definer validates its input at call time and returns a typed resource object. See the [reference docs](https://reference.sanity.io/_sanity/blueprints) for full configuration details and additional resource types.

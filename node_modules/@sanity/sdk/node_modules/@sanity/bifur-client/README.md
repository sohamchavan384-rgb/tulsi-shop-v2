# @sanity/bifur-client

A WebSocket client for Sanity's Bifur real-time service. Communicates over JSON-RPC 2.0 and returns RxJS Observables.

## Installation

```sh
npm install @sanity/bifur-client
```

## Usage

### From a `@sanity/client` instance

The simplest way to get started if you already use `@sanity/client`:

```ts
import {fromSanityClient} from '@sanity/bifur-client'
import {createClient} from '@sanity/client'

const sanityClient = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  token: 'your-token',
})

const bifur = fromSanityClient(sanityClient)
```

### From a WebSocket URL

Connect directly to a Bifur WebSocket endpoint:

```ts
import {fromUrl} from '@sanity/bifur-client'
import {of} from 'rxjs'

const bifur = fromUrl('wss://example.sanity.io/socket/production', {
  timeout: 10_000,
  token$: of('your-token'),
})
```

#### Options

| Option | Type | Description |
|--------|------|-------------|
| `timeout` | `number` | Milliseconds to wait before timing out the initial connection |
| `token$` | `Observable<string \| null>` | Observable of auth tokens. Emitting a new value re-authenticates the connection |

### Presence example

Subscribe to presence events with `listen()`, and send requests with `request()`:

```ts
// Subscribe to presence events
bifur.listen('presence').subscribe((event) => {
  console.log(event.type, event) // 'rollCall', 'state', or 'disconnect'
})

// Respond to roll calls
bifur.request('presence_rollcall', {session: sessionId})

// Announce your location
bifur.request('presence_announce', {
  data: {sessionId, locations: [{documentId: 'my-doc', path: 'title'}]},
})

// Disconnect
bifur.request('presence_disconnect', {session: sessionId})
```

### Heartbeats

`heartbeats` is an Observable that emits a `Date` each time a message (including heartbeat pings) is received. Subscribing to it keeps the connection alive between requests:

```ts
bifur.heartbeats.subscribe((timestamp) => {
  console.log('Last activity:', timestamp)
})
```

### Request and subscribe methods

**Request methods:** `presence_rollcall`, `presence_announce`, `presence_disconnect`, `authorization`

**Subscribe methods:** `presence`, `authorization`

### Error codes

```ts
import {ERROR_CODES} from '@sanity/bifur-client'

// Connection-level
ERROR_CODES.BAD_REQUEST     // 4000
ERROR_CODES.UNAUTHORIZED    // 4001
ERROR_CODES.NOT_FOUND       // 4004

// Application-level (JSON-RPC)
ERROR_CODES.INVALID_REQUEST        // -32600
ERROR_CODES.METHOD_NOT_FOUND       // -32601
ERROR_CODES.INVALID_PARAMS         // -32602
ERROR_CODES.SUBSCRIPTION_NOT_FOUND // -32602
ERROR_CODES.PARSE_ERROR            // -32700
```

## License

MIT - See LICENSE

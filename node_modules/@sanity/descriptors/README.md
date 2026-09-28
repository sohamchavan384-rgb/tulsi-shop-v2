# Descriptors

_Descriptors_ is a way of serializing definitions (e.g. schema types) so they can be easily shared across Content Lake.
It has the following characteristics:

- **JSON native:**
  A descriptor is encoded using JSON with support for the typical JSON values: Objects, arrays, strings, booleans, floats.
- **Content-addressable:** Each descriptor has an `id` which is the SHA-256 hash of the contents.
  The same descriptor will always end up with the same `id`.
- **Recursively defined:**
  It's common for descriptors to refer to _other_ descriptors by their `id`.
  That way you can refer to a whole graph of interconnected descriptors by a single root `id`.
  This is very similar to how a blockchain works, but without the utter waste of energy.
- **Efficient synchronization:**
  The format is designed so that it's possible to efficiently synchronize when there's only been a few changes on the client-side.
  This is possible without the client storing any additional information about the state of the server.

Here's an example of two descriptors: One named schema type, and then one schema registry which ties it together (so that recursively defined types can be represented).

```ts
{
  "id": "uEiA4r6C4bPFx1dMadoWeZ4ZJxLLXGzeNojZIsnGxp6g0rw",
  "type": "sanity.schema.registry"
  "content": [
    "uEiDPWicraeaSOVaZEUlyrF6RFDRURU4XCLsNR7zCLoNAcg",
    "uEiChs9ZdIsaYe7KLKSVk3b1yApMvlHIO8UvebgjJYTUMAQ"
  ]
}

{
  "id": "uEiChs9ZdIsaYe7KLKSVk3b1yApMvlHIO8UvebgjJYTUMAQ",
  "type": "sanity.schema.namedType",
  "name": "username",
  "typeDef": {
    "subtypeOf": "string",
    "title": "Username"
  }
}
```

## Usage

Once a client has built a descriptor it can **send it into Content Lake** and then start using the ID towards other services.
It's important to realize that "sending it into Content Lake" doesn't make it visible anywhere.
Studio can upload the schema into Content Lake and the _only_ thing that happens is that now it can use the `schemaId` towards e.g. Agent Action.
The concept of for instance saying "dataset X has schema Y" is **not** solved here.
What we're dealing with here is how to _represent_ that schema on the server-side and being able to _refer_ to it.

## Further documentation

To learn more:

- [docs/format.md](docs/format.md) describes the overall structure of the format.
- [docs/sync.md](docs/sync.md) describes the efficient synchronization protocol.
- [playground/](playground) is a demo application which shows the synchronization protocol.

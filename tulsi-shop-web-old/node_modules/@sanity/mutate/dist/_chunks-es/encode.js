import { stringify } from "./stringify.js";
function encode(mutation) {
  return encodeMutation(mutation);
}
function encodeAll(mutations) {
  return mutations.flatMap(encode);
}
function encodeTransaction(transaction) {
  return {
    transactionId: transaction.id,
    mutations: encodeAll(transaction.mutations)
  };
}
function encodeMutation(mutation) {
  switch (mutation.type) {
    case "create":
      return { [mutation.type]: mutation.document };
    case "createIfNotExists":
      return { [mutation.type]: mutation.document };
    case "createOrReplace":
      return { [mutation.type]: mutation.document };
    case "delete":
      return {
        delete: { id: mutation.id }
      };
    case "patch": {
      const ifRevisionID = mutation.options?.ifRevision;
      return mutation.patches.map((patch) => ({
        patch: {
          id: mutation.id,
          ...ifRevisionID && { ifRevisionID },
          ...encodePatch(patch)
        }
      }));
    }
  }
}
function encodePatch(patch) {
  const { path, op } = patch;
  if (op.type === "unset")
    return { unset: [stringify(path)] };
  if (op.type === "insert")
    return {
      insert: {
        [op.position]: stringify([...path, op.referenceItem]),
        items: op.items
      }
    };
  if (op.type === "diffMatchPatch")
    return { diffMatchPatch: { [stringify(path)]: op.value } };
  if (op.type === "inc")
    return { inc: { [stringify(path)]: op.amount } };
  if (op.type === "dec")
    return { dec: { [stringify(path)]: op.amount } };
  if (op.type === "set" || op.type === "setIfMissing")
    return { [op.type]: { [stringify(path)]: op.value } };
  if (op.type === "truncate") {
    const range = [
      op.startIndex,
      typeof op.endIndex == "number" ? op.endIndex : ""
    ].join(":");
    return { unset: [`${stringify(path)}[${range}]`] };
  }
  if (op.type === "upsert")
    return {
      unset: op.items.map(
        (item) => stringify([...path, { _key: item._key }])
      ),
      insert: {
        [op.position]: stringify([...path, op.referenceItem]),
        items: op.items
      }
    };
  if (op.type === "assign")
    return {
      set: Object.fromEntries(
        Object.keys(op.value).map((key) => [
          stringify(path.concat(key)),
          op.value[key]
        ])
      )
    };
  if (op.type === "unassign")
    return {
      unset: op.keys.map((key) => stringify(path.concat(key)))
    };
  if (op.type === "replace")
    return {
      insert: {
        replace: stringify(path.concat(op.referenceItem)),
        items: op.items
      }
    };
  if (op.type === "remove")
    return {
      unset: [stringify(path.concat(op.referenceItem))]
    };
  throw op.type === "insertIfMissing" ? new Error("Patch type insertIfMissing is not supported by Sanity") : new Error(`Unknown operation type ${op.type}`);
}
export {
  encode,
  encodeAll,
  encodeMutation,
  encodePatch,
  encodeTransaction
};
//# sourceMappingURL=encode.js.map

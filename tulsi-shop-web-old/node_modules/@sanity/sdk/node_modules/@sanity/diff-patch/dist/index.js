import { stringifyPatches, makePatches } from "@sanity/diff-match-patch";
const IS_DOTTABLE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
function pathToString(path) {
  return path.reduce((target, segment, i) => {
    if (Array.isArray(segment))
      return `${target}[${segment.join(":")}]`;
    if (isKeyedObject(segment))
      return `${target}[_key=="${segment._key}"]`;
    if (typeof segment == "number")
      return `${target}[${segment}]`;
    if (typeof segment == "string" && !IS_DOTTABLE_RE.test(segment))
      return `${target}['${segment}']`;
    if (typeof segment == "string")
      return `${target}${i === 0 ? "" : "."}${segment}`;
    throw new Error(`Unsupported path segment "${segment}"`);
  }, "");
}
function isKeyedObject(obj) {
  return typeof obj == "object" && !!obj && "_key" in obj && typeof obj._key == "string";
}
class DiffError extends Error {
  path;
  value;
  serializedPath;
  constructor(message, path, value) {
    const serializedPath = pathToString(path);
    super(`${message} (at '${serializedPath}')`), this.path = path, this.serializedPath = serializedPath, this.value = value;
  }
}
const idPattern = /^[a-z0-9][a-z0-9_.-]+$/i, propPattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/, propStartPattern = /^[a-z_]/i;
function validateProperty(property, value, path) {
  if (!propStartPattern.test(property))
    throw new DiffError("Keys must start with a letter (a-z)", path.concat(property), value);
  if (!propPattern.test(property))
    throw new DiffError(
      "Keys can only contain letters, numbers and underscores",
      path.concat(property),
      value
    );
  if (property === "_key" || property === "_ref" || property === "_type") {
    if (typeof value != "string")
      throw new DiffError("Keys must be strings", path.concat(property), value);
    if (!idPattern.test(value))
      throw new DiffError("Invalid key - use less exotic characters", path.concat(property), value);
  }
  return property;
}
function difference(source, target) {
  if ("difference" in Set.prototype)
    return source.difference(target);
  const result = /* @__PURE__ */ new Set();
  for (const item of source)
    target.has(item) || result.add(item);
  return result;
}
function intersection(source, target) {
  if ("intersection" in Set.prototype)
    return source.intersection(target);
  const result = /* @__PURE__ */ new Set();
  for (const item of source)
    target.has(item) && result.add(item);
  return result;
}
const SYSTEM_KEYS = ["_id", "_type", "_createdAt", "_updatedAt", "_rev"], DMP_MAX_STRING_SIZE = 1e6, DMP_MAX_STRING_LENGTH_CHANGE_RATIO = 0.4, DMP_MIN_SIZE_FOR_RATIO_CHECK = 1e4;
function diffPatch(source, target, options = {}) {
  const id = options.id || source._id === target._id && source._id, revisionLocked = options.ifRevisionID, ifRevisionID = typeof revisionLocked == "boolean" ? source._rev : revisionLocked, basePath = options.basePath || [];
  if (!id)
    throw new Error(
      "_id on source and target not present or differs, specify document id the mutations should be applied to"
    );
  if (revisionLocked === !0 && !ifRevisionID)
    throw new Error(
      "`ifRevisionID` is set to `true`, but no `_rev` was passed in item A. Either explicitly set `ifRevisionID` to a revision, or pass `_rev` as part of item A."
    );
  if (basePath.length === 0 && source._type !== target._type)
    throw new Error(`_type is immutable and cannot be changed (${source._type} => ${target._type})`);
  const operations = diffItem(source, target, basePath, []);
  return serializePatches(operations).map((patchOperations, i) => ({
    patch: {
      id,
      // only add `ifRevisionID` to the first patch
      ...i === 0 && ifRevisionID && { ifRevisionID },
      ...patchOperations
    }
  }));
}
function diffValue(source, target, basePath = []) {
  return serializePatches(diffItem(source, target, basePath));
}
function diffItem(source, target, path = [], patches = []) {
  return source === target ? patches : typeof source == "string" && typeof target == "string" ? (diffString(source, target, path, patches), patches) : Array.isArray(source) && Array.isArray(target) ? (diffArray(source, target, path, patches), patches) : isRecord(source) && isRecord(target) ? (diffObject(source, target, path, patches), patches) : target === void 0 ? (patches.push({ op: "unset", path }), patches) : (patches.push({ op: "set", path, value: target }), patches);
}
function diffObject(source, target, path, patches) {
  const atRoot = path.length === 0, aKeys = Object.keys(source).filter(atRoot ? isNotIgnoredKey : yes).map((key) => validateProperty(key, source[key], path)), aKeysLength = aKeys.length, bKeys = Object.keys(target).filter(atRoot ? isNotIgnoredKey : yes).map((key) => validateProperty(key, target[key], path)), bKeysLength = bKeys.length;
  for (let i = 0; i < aKeysLength; i++) {
    const key = aKeys[i];
    key in target || patches.push({ op: "unset", path: path.concat(key) });
  }
  for (let i = 0; i < bKeysLength; i++) {
    const key = bKeys[i];
    diffItem(source[key], target[key], path.concat([key]), patches);
  }
  return patches;
}
function diffArray(source, target, path, patches) {
  return isUniquelyKeyed(source) && isUniquelyKeyed(target) ? diffArrayByKey(source, target, path, patches) : diffArrayByIndex(source, target, path, patches);
}
function diffArrayByIndex(source, target, path, patches) {
  if (target.length > source.length && patches.push({
    op: "insert",
    position: "after",
    path: path.concat([-1]),
    items: target.slice(source.length).map(nullifyUndefined)
  }), target.length < source.length) {
    const isSingle = source.length - target.length === 1, unsetItems = source.slice(target.length);
    isUniquelyKeyed(unsetItems) ? patches.push(
      ...unsetItems.map(
        (item) => ({ op: "unset", path: path.concat({ _key: item._key }) })
      )
    ) : patches.push({
      op: "unset",
      path: path.concat([isSingle ? target.length : [target.length, ""]])
    });
  }
  for (let i = 0; i < target.length; i++)
    if (Array.isArray(target[i]))
      throw new DiffError("Multi-dimensional arrays not supported", path.concat(i), target[i]);
  const overlapping = Math.min(source.length, target.length), segmentA = source.slice(0, overlapping), segmentB = target.slice(0, overlapping);
  for (let i = 0; i < segmentA.length; i++)
    diffItem(segmentA[i], nullifyUndefined(segmentB[i]), path.concat(i), patches);
  return patches;
}
function diffArrayByKey(source, target, path, patches) {
  const sourceItemsByKey = new Map(source.map((item) => [item._key, item])), targetItemsByKey = new Map(target.map((item) => [item._key, item])), sourceKeys = new Set(sourceItemsByKey.keys()), targetKeys = new Set(targetItemsByKey.keys()), keysRemovedFromSource = difference(sourceKeys, targetKeys), keysAddedToTarget = difference(targetKeys, sourceKeys), keysInBothArrays = intersection(sourceKeys, targetKeys), sourceKeysStillPresent = Array.from(difference(sourceKeys, keysRemovedFromSource)), targetKeysAlreadyPresent = Array.from(difference(targetKeys, keysAddedToTarget)), keyReorderOperations = [];
  for (let i = 0; i < keysInBothArrays.size; i++) {
    const keyAtPositionInSource = sourceKeysStillPresent[i], keyAtPositionInTarget = targetKeysAlreadyPresent[i];
    keyAtPositionInSource !== keyAtPositionInTarget && keyReorderOperations.push({
      sourceKey: keyAtPositionInSource,
      targetKey: keyAtPositionInTarget
    });
  }
  keyReorderOperations.length && patches.push({
    op: "reorder",
    path,
    snapshot: source,
    reorders: keyReorderOperations
  });
  for (const key of keysInBothArrays)
    diffItem(sourceItemsByKey.get(key), targetItemsByKey.get(key), [...path, { _key: key }], patches);
  for (const keyToRemove of keysRemovedFromSource)
    patches.push({ op: "unset", path: [...path, { _key: keyToRemove }] });
  if (keysAddedToTarget.size) {
    let insertionAnchorKey, itemsPendingInsertion = [];
    const flushPendingInsertions = () => {
      itemsPendingInsertion.length && patches.push({
        op: "insert",
        // Insert after the anchor key if we have one, otherwise insert at the beginning
        ...insertionAnchorKey ? { position: "after", path: [...path, { _key: insertionAnchorKey }] } : { position: "before", path: [...path, 0] },
        items: itemsPendingInsertion
      });
    };
    for (const key of targetKeys)
      keysAddedToTarget.has(key) ? itemsPendingInsertion.push(targetItemsByKey.get(key)) : keysInBothArrays.has(key) && (flushPendingInsertions(), insertionAnchorKey = key, itemsPendingInsertion = []);
    flushPendingInsertions();
  }
  return patches;
}
function shouldUseDiffMatchPatch(source, target) {
  const maxLength = Math.max(source.length, target.length);
  return maxLength > DMP_MAX_STRING_SIZE ? !1 : maxLength < DMP_MIN_SIZE_FOR_RATIO_CHECK ? !0 : !(Math.abs(target.length - source.length) / maxLength > DMP_MAX_STRING_LENGTH_CHANGE_RATIO);
}
function getDiffMatchPatch(source, target, path) {
  const last = path.at(-1);
  if (!(typeof last == "string" && last.startsWith("_")) && shouldUseDiffMatchPatch(source, target))
    try {
      const strPatch = stringifyPatches(makePatches(source, target));
      return { op: "diffMatchPatch", path, value: strPatch };
    } catch {
      return;
    }
}
function diffString(source, target, path, patches) {
  const dmp = getDiffMatchPatch(source, target, path);
  return patches.push(dmp ?? { op: "set", path, value: target }), patches;
}
function isNotIgnoredKey(key) {
  return SYSTEM_KEYS.indexOf(key) === -1;
}
function serializePatches(patches, curr) {
  const [patch, ...rest] = patches;
  if (!patch) return curr ? [curr] : [];
  switch (patch.op) {
    case "set":
    case "diffMatchPatch": {
      const emptyOp = { [patch.op]: {} };
      return curr ? patch.op in curr ? (Object.assign(curr[patch.op], { [pathToString(patch.path)]: patch.value }), serializePatches(rest, curr)) : [curr, ...serializePatches(patches, emptyOp)] : serializePatches(patches, emptyOp);
    }
    case "unset": {
      const emptyOp = { unset: [] };
      return curr ? "unset" in curr ? (curr.unset.push(pathToString(patch.path)), serializePatches(rest, curr)) : [curr, ...serializePatches(patches, emptyOp)] : serializePatches(patches, emptyOp);
    }
    case "insert":
      return curr ? [curr, ...serializePatches(patches)] : [
        {
          insert: {
            [patch.position]: pathToString(patch.path),
            items: patch.items
          }
        },
        ...serializePatches(rest)
      ];
    case "reorder": {
      if (curr) return [curr, ...serializePatches(patches)];
      const tempKeyOperations = {};
      tempKeyOperations.set = {};
      for (const { sourceKey, targetKey } of patch.reorders) {
        const temporaryKey = `__temp_reorder_${sourceKey}__`, finalContentForThisPosition = patch.snapshot[getIndexForKey(patch.snapshot, targetKey)];
        Object.assign(tempKeyOperations.set, {
          [pathToString([...patch.path, { _key: sourceKey }])]: {
            ...finalContentForThisPosition,
            _key: temporaryKey
          }
        });
      }
      const finalKeyOperations = {};
      finalKeyOperations.set = {};
      for (const { sourceKey, targetKey } of patch.reorders) {
        const temporaryKey = `__temp_reorder_${sourceKey}__`;
        Object.assign(finalKeyOperations.set, {
          [pathToString([...patch.path, { _key: temporaryKey }, "_key"])]: targetKey
        });
      }
      return [tempKeyOperations, finalKeyOperations, ...serializePatches(rest)];
    }
    default:
      return [];
  }
}
function isUniquelyKeyed(arr) {
  const seenKeys = /* @__PURE__ */ new Set();
  for (const item of arr) {
    if (!isKeyedObject(item) || seenKeys.has(item._key)) return !1;
    seenKeys.add(item._key);
  }
  return !0;
}
const keyToIndexCache = /* @__PURE__ */ new WeakMap();
function getIndexForKey(keyedArray, targetKey) {
  const cachedMapping = keyToIndexCache.get(keyedArray);
  if (cachedMapping) return cachedMapping[targetKey];
  const keyToIndexMapping = keyedArray.reduce(
    (mapping, { _key }, arrayIndex) => (mapping[_key] = arrayIndex, mapping),
    {}
  );
  return keyToIndexCache.set(keyedArray, keyToIndexMapping), keyToIndexMapping[targetKey];
}
function isRecord(value) {
  return typeof value == "object" && !!value && !Array.isArray(value);
}
function nullifyUndefined(item) {
  return item === void 0 ? null : item;
}
function yes(_) {
  return !0;
}
export {
  DiffError,
  diffPatch,
  diffValue
};
//# sourceMappingURL=index.js.map

"use strict";
var shared = require("./shared.js");
function isEqual(a, b) {
  return a.type === "string" && b.type === "string" || a.type === "boolean" && b.type === "boolean" || a.type === "null" && b.type === "null" || a.type === "number" && b.type === "number" ? a.data === b.data : a.type === "datetime" && b.type === "datetime" ? a.data.equals(b.data) : !1;
}
function deepEqual(a, b) {
  if (a === null || b === null) return a === b;
  const typeOfA = typeof a, typeOfB = typeof b;
  if (typeOfA === "undefined" && typeOfB === "undefined") return !0;
  if (typeOfA === "function" && typeOfB === "function") return a === b;
  if (typeOfA === "object" && typeOfB === "object") {
    const keysOfA = Object.keys(a), keysOfB = Object.keys(b);
    if (keysOfA.length !== keysOfB.length) return !1;
    for (const key of keysOfA)
      if (!deepEqual(a[key], b[key])) return !1;
    return !0;
  }
  return a === b;
}
const array = {};
array.join = mappedExecutor(
  (args) => args,
  (_, arr, sep) => {
    if (arr.type !== "array" || sep.type !== "string")
      return shared.NULL_VALUE;
    let buf = "", needSep = !1;
    for (const elem of arr.data) {
      switch (needSep && (buf += sep.data), shared.getType(elem)) {
        case "number":
        case "string":
        case "boolean":
        case "datetime":
          buf += `${elem}`;
          break;
        default:
          return shared.NULL_VALUE;
      }
      needSep = !0;
    }
    return shared.fromString(buf);
  }
);
array.compact = arrayExecutor(
  ([array2]) => ({ array: array2 }),
  function* (_, item) {
    item !== null && (yield item);
  }
);
array.unique = arrayExecutor(
  (args) => ({ array: args[0], state: /* @__PURE__ */ new Set() }),
  function* (_node, iter, _inner, added) {
    switch (shared.getType(iter)) {
      case "number":
      case "string":
      case "boolean":
      case "datetime":
        added.has(iter) || (added.add(iter), yield iter);
        break;
      default:
        yield iter;
    }
  }
);
array.intersects = mappedExecutor(
  (args) => args,
  (_, arr1, arr2) => {
    if (arr1.type !== "array" || arr2.type !== "array")
      return shared.NULL_VALUE;
    for (const v1 of arr1.data)
      for (const v2 of arr2.data)
        if (isEqual(shared.fromJS(v1), shared.fromJS(v2)))
          return shared.TRUE_VALUE;
    return shared.FALSE_VALUE;
  }
);
const dateTime = {};
dateTime.now = constantExecutor(
  (_, scope) => shared.fromDateTime(new shared.DateTime(scope.context.timestamp))
);
async function valueAtPath(arg, keyPath) {
  function tryAccessor(arg2, accessor) {
    try {
      return arg2[accessor];
    } catch {
      return;
    }
  }
  let current = await arg.get();
  for (const part of keyPath)
    if (current = tryAccessor(current, part), !current) break;
  return current;
}
function startsWith(keyPath, prefix) {
  return prefix.every((item, index) => keyPath[index] === item);
}
async function* diffKeyPaths(before, after) {
  const currPaths = [[]];
  for (; currPaths.length > 0; ) {
    const currPath = currPaths.shift() || [], b = shared.fromJS(await valueAtPath(before, currPath)), a = shared.fromJS(await valueAtPath(after, currPath));
    if (a.type !== b.type)
      yield currPath;
    else if (a.type === "string" && b.type === "string" || a.type === "boolean" && b.type === "boolean" || a.type === "null" && b.type === "null" || a.type === "number" && b.type === "number")
      a.data !== b.data && (yield currPath);
    else if (a.type === "datetime" && b.type === "datetime")
      a.data.equals(b.data) || (yield currPath);
    else if (a.type === "object" && b.type === "object") {
      if (!deepEqual(a.data, b.data)) {
        const aKeys = Object.keys(a.data), bKeys = Object.keys(b.data);
        new Set(aKeys.concat(bKeys)).forEach((key) => {
          currPaths.push([...currPath, key]);
        });
      }
    } else if (a.type === "array" && b.type === "array") {
      if (a.data.length !== b.data.length)
        yield currPath;
      else if (!deepEqual(a.data, b.data))
        for (let i = 0; i < b.data.length; i++)
          currPaths.push([...currPath, i]);
    } else if (a.type === "stream" && b.type === "stream") {
      const arrayA = await a.get(), arrayB = await b.get();
      if (arrayA.length !== arrayB.length)
        yield currPath;
      else if (!deepEqual(arrayA, arrayB))
        for (let i = 0; i < arrayB.length; i++)
          currPaths.push([...currPath, i]);
    }
  }
}
async function evaluateSelector(node, value, scope) {
  switch (node.type) {
    case "Group":
      return await evaluateSelector(node.base, value, scope);
    case "Tuple":
      const tuplePaths = [];
      for (const member of node.members) {
        const memberPaths = await evaluateSelector(member, value, scope);
        tuplePaths.push(...memberPaths);
      }
      return tuplePaths;
    case "AccessAttribute":
      return node.base ? (await evaluateSelector(node.base, value, scope)).map((path) => [...path, node.name]) : [[node.name]];
    case "ArrayCoerce": {
      const paths = await evaluateSelector(node.base, value, scope), arrayPaths = [];
      for (const keyPath of paths) {
        const innerValue = await valueAtPath(value, keyPath);
        if (Array.isArray(innerValue))
          for (let i = 0; i < innerValue.length; i++)
            arrayPaths.push([...keyPath, i]);
      }
      return arrayPaths;
    }
    case "Filter": {
      const paths = await evaluateSelector(node.base, value, scope), filter = {
        ...node,
        base: { type: "This" }
      }, arrayPaths = [];
      for (const keyPath of paths) {
        const innerValue = await valueAtPath(value, keyPath);
        if (Array.isArray(innerValue))
          for (let i = 0; i < innerValue.length; i++) {
            const item = innerValue[i], nestedScope = scope.createNested(shared.fromJS([item]));
            (await (await evaluate(filter, nestedScope)).get()).length > 0 && arrayPaths.push([...keyPath, i]);
          }
      }
      return arrayPaths;
    }
    case "SelectorFuncCall":
      return anywhere(node.arg, scope.createHidden(value));
    case "SelectorNested": {
      const { base, nested: expr } = node, paths = await evaluateSelector(base, value, scope), nestedPaths = [];
      for (const keyPath of paths) {
        const innerValue = await valueAtPath(value, keyPath);
        switch (expr.type) {
          case "AccessAttribute":
          case "ArrayCoerce":
          case "Filter":
            const accessPaths = await evaluateSelector(expr, shared.fromJS(innerValue), scope);
            for (let i = 0; i < accessPaths.length; i++)
              nestedPaths.push([...keyPath, ...accessPaths[i]]);
            break;
          case "Group":
            const innerResult = await evaluateSelector(expr.base, shared.fromJS(innerValue), scope);
            for (const innerKeyPath of innerResult)
              nestedPaths.push([...keyPath, ...innerKeyPath]);
            break;
          case "Tuple":
            for (const inner of expr.members) {
              const innerResult2 = await evaluateSelector(inner, shared.fromJS(innerValue), scope);
              for (const innerKeyPath of innerResult2)
                nestedPaths.push([...keyPath, ...innerKeyPath]);
            }
        }
      }
      return nestedPaths;
    }
  }
}
async function anywhere(expr, scope, base = []) {
  const value = scope.value, pathList = [];
  if (value.isArray()) {
    const arr = await value.get();
    for (let i = 0; i < arr.length; i++) {
      const subPaths = await anywhere(expr, scope.createHidden(shared.fromJS(arr[i])), [...base, i]);
      pathList.push(...subPaths);
    }
  } else if (value.type === "object") {
    const result = await evaluate(expr, scope);
    result.type === "boolean" && result.data === !0 && pathList.push(base);
    for (const key of Object.keys(value.data)) {
      const subPaths = await anywhere(expr, scope.createHidden(shared.fromJS(value.data[key])), [
        ...base,
        key
      ]);
      pathList.push(...subPaths);
    }
  }
  return pathList;
}
async function changedAny(before, after, selector, scope) {
  const beforeSelectorScope = scope.createHidden(before), beforePaths = await evaluateSelector(
    selector,
    beforeSelectorScope.value,
    beforeSelectorScope
  ), afterSelectorScope = scope.createHidden(after), afterPaths = await evaluateSelector(selector, afterSelectorScope.value, afterSelectorScope);
  if (beforePaths.length !== afterPaths.length)
    return shared.TRUE_VALUE;
  for (const path of beforePaths) {
    for (let i = 0; i < path.length; i++)
      if (typeof path[i] == "number") {
        const slice = path.slice(0, i), beforeArr = await valueAtPath(before, slice), afterArr = await valueAtPath(after, slice);
        if (!Array.isArray(beforeArr) || !Array.isArray(afterArr) || beforeArr.length !== afterArr.length)
          return shared.TRUE_VALUE;
      }
    const beforeValue = await valueAtPath(before, path), afterValue = await valueAtPath(after, path);
    if (!deepEqual(beforeValue, afterValue))
      return shared.TRUE_VALUE;
  }
  return shared.FALSE_VALUE;
}
async function changedOnly(before, after, selector, scope) {
  const beforeSelectorScope = scope.createHidden(before), selectedPaths = await evaluateSelector(
    selector,
    beforeSelectorScope.value,
    beforeSelectorScope
  );
  for await (const diffPath of diffKeyPaths(before, after)) {
    let found = !1;
    for (const selectedPath of selectedPaths)
      if (startsWith(diffPath, selectedPath)) {
        found = !0;
        break;
      }
    if (!found)
      return shared.FALSE_VALUE;
  }
  return shared.TRUE_VALUE;
}
const diff = {};
diff.changedAny = asyncOnlyExecutor(async (args, scope) => {
  const lhs = args[0], rhs = args[1], selector = args[2];
  if (!shared.isSelectorNode(selector)) throw new Error("changedAny third argument must be a selector");
  const before = await executeAsync(lhs, scope), after = await executeAsync(rhs, scope);
  return changedAny(before, after, selector, scope);
});
diff.changedOnly = asyncOnlyExecutor(async (args, scope) => {
  const lhs = args[0], rhs = args[1], selector = args[2];
  if (!shared.isSelectorNode(selector)) throw new Error("changedOnly third argument must be a selector");
  const before = await executeAsync(lhs, scope), after = await executeAsync(rhs, scope);
  return changedOnly(before, after, selector, scope);
});
const delta = {};
delta.operation = constantExecutor((_, scope) => {
  const hasBefore = scope.context.before !== null, hasAfter = scope.context.after !== null;
  return hasBefore && hasAfter ? shared.fromString("update") : hasAfter ? shared.fromString("create") : hasBefore ? shared.fromString("delete") : shared.NULL_VALUE;
});
delta.changedAny = asyncOnlyExecutor(async (args, scope) => {
  const before = scope.context.before || shared.NULL_VALUE, after = scope.context.after || shared.NULL_VALUE, selector = args[0];
  if (!shared.isSelectorNode(selector)) throw new Error("changedAny first argument must be a selector");
  return changedAny(before, after, selector, scope);
});
delta.changedOnly = asyncOnlyExecutor(async (args, scope) => {
  const before = scope.context.before || shared.NULL_VALUE, after = scope.context.after || shared.NULL_VALUE, selector = args[0];
  if (!shared.isSelectorNode(selector)) throw new Error("changedOnly first argument must be a selector");
  return changedOnly(before, after, selector, scope);
});
const documents = {};
documents.get = constantExecutor(() => {
  throw new Error("not implemented");
});
documents.incomingRefCount = constantExecutor(() => {
  throw new Error("not implemented");
});
documents.incomingGlobalDocumentReferenceCount = constantExecutor(() => {
  throw new Error("not implemented");
});
const geo = {};
geo.latLng = constantExecutor(() => {
  throw new Error("not implemented");
});
geo.contains = constantExecutor(() => {
  throw new Error("not implemented");
});
geo.intersects = constantExecutor(() => {
  throw new Error("not implemented");
});
geo.distance = constantExecutor(() => {
  throw new Error("not implemented");
});
const string = {};
string.lower = mappedExecutor(
  (args) => args,
  (_, value) => value.type !== "string" ? shared.NULL_VALUE : shared.fromString(value.data.toLowerCase())
);
string.upper = mappedExecutor(
  (args) => args,
  (_, value) => value.type !== "string" ? shared.NULL_VALUE : shared.fromString(value.data.toUpperCase())
);
string.split = mappedExecutor(
  (args) => args,
  (_, str, sep) => str.type !== "string" || sep.type !== "string" ? shared.NULL_VALUE : str.data.length === 0 ? shared.fromArray([]) : sep.data.length === 0 ? shared.fromArray(Array.from(str.data)) : shared.fromArray(str.data.split(sep.data))
);
string.startsWith = mappedExecutor(
  (args) => args,
  (_, str, prefix) => str.type !== "string" || prefix.type !== "string" ? shared.NULL_VALUE : str.data.startsWith(prefix.data) ? shared.TRUE_VALUE : shared.FALSE_VALUE
);
const _global = {};
_global.anywhere = constantExecutor(() => {
  throw new Error("not implemented");
});
_global.coalesce = {
  async executeAsync(args, scope) {
    for (const arg of args) {
      const value = await executeAsync(arg, scope);
      if (value.type !== "null")
        return value;
    }
    return shared.NULL_VALUE;
  },
  executeSync(args, scope) {
    for (const arg of args) {
      const value = executeSync(arg, scope);
      if (value.type !== "null")
        return value;
    }
    return shared.NULL_VALUE;
  }
};
_global.count = arrayReducerExecutor(
  (args) => ({ array: args[0] }),
  () => 0,
  (_, count) => count + 1,
  shared.fromNumber
);
_global.dateTime = mappedExecutor(
  (args) => args,
  (_, val) => val.type === "datetime" ? val : val.type !== "string" ? shared.NULL_VALUE : shared.DateTime.parseToValue(val.data)
);
_global.defined = mappedExecutor(
  (args) => args,
  (_, inner) => inner.type === "null" ? shared.FALSE_VALUE : shared.TRUE_VALUE
);
_global.identity = constantExecutor((_args, scope) => shared.fromString(scope.context.identity));
_global.length = mappedExecutor(
  (args) => args,
  (_, inner) => inner.type === "string" ? shared.fromNumber(countUTF8(inner.data)) : inner.type === "array" ? shared.fromNumber(inner.data.length) : shared.NULL_VALUE
);
_global.path = mappedExecutor(
  (args) => args,
  (_, inner) => inner.type !== "string" ? shared.NULL_VALUE : shared.fromPath(new shared.Path(inner.data))
);
_global.string = mappedExecutor(
  (args) => args,
  (_, value) => {
    switch (value.type) {
      case "number":
      case "string":
      case "boolean":
      case "datetime":
        return shared.fromString(`${value.data}`);
      default:
        return shared.NULL_VALUE;
    }
  }
);
_global.references = mappedExecutor(
  (args) => [{ type: "This" }, ...args],
  (_, scopeValue, ...args) => {
    const pathSet = /* @__PURE__ */ new Set();
    for (const path of args)
      if (path.type === "string")
        pathSet.add(path.data);
      else if (path.type === "array")
        for (const elem of path.data)
          typeof elem == "string" && pathSet.add(elem);
    return pathSet.size === 0 ? shared.FALSE_VALUE : hasReference(scopeValue, pathSet) ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  }
);
_global.round = mappedExecutor(
  (args) => args,
  (_, value, precValue) => {
    if (value.type !== "number")
      return shared.NULL_VALUE;
    const num = value.data;
    let prec = 0;
    if (precValue) {
      if (precValue.type !== "number" || precValue.data < 0 || !Number.isInteger(precValue.data))
        return shared.NULL_VALUE;
      prec = precValue.data;
    }
    return prec === 0 ? num < 0 ? shared.fromNumber(-Math.round(-num)) : shared.fromNumber(Math.round(num)) : shared.fromNumber(Number(num.toFixed(prec)));
  }
);
_global.now = constantExecutor((_args, scope) => shared.fromString(scope.context.timestamp.toISOString()));
_global.boost = constantExecutor(() => {
  throw new Error("unexpected boost call");
});
_global.lower = string.lower;
_global.upper = string.upper;
function countUTF8(str) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    code >= 55296 && code <= 56319 || count++;
  }
  return count;
}
function hasReference(value, pathSet) {
  switch (shared.getType(value)) {
    case "array":
      for (const v of value)
        if (hasReference(v, pathSet))
          return !0;
      break;
    case "object":
      if (value._ref)
        return pathSet.has(value._ref);
      for (const v of Object.values(value))
        if (hasReference(v, pathSet))
          return !0;
      break;
  }
  return !1;
}
const math = {};
math.min = arrayReducerExecutor(
  (args) => ({ array: args[0] }),
  () => {
  },
  (_, n, item) => item === null ? n : typeof item != "number" ? STOP_ITERATOR : n === void 0 || item < n ? item : n,
  (n) => n === void 0 ? shared.NULL_VALUE : shared.fromNumber(n)
);
math.max = arrayReducerExecutor(
  (args) => ({ array: args[0] }),
  () => {
  },
  (_, n, item) => item === null ? n : typeof item != "number" ? STOP_ITERATOR : n === void 0 || item > n ? item : n,
  (n) => n === void 0 ? shared.NULL_VALUE : shared.fromNumber(n)
);
math.sum = arrayReducerExecutor(
  (args) => ({ array: args[0] }),
  () => 0,
  (_, n, item) => item === null ? n : typeof item != "number" ? STOP_ITERATOR : n + item,
  shared.fromNumber
);
math.avg = arrayReducerExecutor(
  (args) => ({ array: args[0] }),
  () => ({ count: 0, sum: 0 }),
  (_, { count, sum }, item) => item === null ? { count, sum } : typeof item != "number" ? STOP_ITERATOR : { count: count + 1, sum: sum + item },
  ({ count, sum }) => count === 0 ? shared.NULL_VALUE : shared.fromNumber(sum / count)
);
const media = {};
media.aspect = constantExecutor(() => {
  throw new Error("not implemented");
});
function portableTextContent(value) {
  if (value.type === "object")
    return blockText(value.data);
  if (value.type === "array") {
    const texts = arrayText(value.data);
    if (texts.length > 0)
      return texts.join(`

`);
  }
  return null;
}
function arrayText(value, result = []) {
  for (const block of value)
    if (Array.isArray(block))
      arrayText(block, result);
    else if (typeof block == "object" && block) {
      const text2 = blockText(block);
      text2 !== null && result.push(text2);
    }
  return result;
}
function blockText(obj) {
  if (typeof obj._type != "string") return null;
  const children = obj.children;
  if (!Array.isArray(children)) return null;
  let result = "";
  for (const child of children)
    child && typeof child == "object" && typeof child._type == "string" && child._type === "span" && typeof child.text == "string" && (result += child.text);
  return result;
}
const pt = {};
pt.text = mappedExecutor(
  (args) => args,
  (_, value) => {
    const text2 = portableTextContent(value);
    return text2 === null ? shared.NULL_VALUE : shared.fromString(text2);
  }
);
const releases = {};
releases.all = arrayExecutor(
  () => ({ array: { type: "Everything" } }),
  function* (_, value) {
    typeof value == "object" && value && "_type" in value && value._type === "system.release" && (yield value);
  }
);
const sanity = {};
sanity.projectId = constantExecutor((_, scope) => scope.context.sanity ? shared.fromString(scope.context.sanity.projectId) : shared.NULL_VALUE);
sanity.dataset = constantExecutor((_, scope) => scope.context.sanity ? shared.fromString(scope.context.sanity.dataset) : shared.NULL_VALUE);
sanity.versionOf = mappedExecutor(
  ([value]) => [value, { type: "This" }],
  (_, value, val) => {
    if (value.type !== "string") return shared.NULL_VALUE;
    const baseId = value.data;
    if (val.type !== "object" || typeof val.data._id != "string") return shared.NULL_VALUE;
    if (val.data._id === baseId) return shared.TRUE_VALUE;
    const components = val.data._id.split(".");
    return components.length >= 2 && components[0] === "drafts" && components.slice(1).join(".") === baseId || components.length >= 3 && components[0] === "versions" && components.slice(2).join(".") === baseId ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  }
);
sanity.partOfRelease = mappedExecutor(
  (args) => [args[0], { type: "This" }],
  (_, value, val) => {
    if (value.type !== "string") return shared.NULL_VALUE;
    const baseId = value.data;
    if (val.type !== "object" || typeof val.data._id != "string") return shared.NULL_VALUE;
    const components = val.data._id.split(".");
    return components.length >= 3 && components[0] === "versions" && components[1] === baseId ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  }
);
const text = {};
text.query = constantExecutor(() => {
  throw new Error("not implemented");
});
text.semanticSimilarity = constantExecutor(() => {
  throw new Error("not implemented");
});
const user = {};
user.attributes = constantExecutor(() => {
  throw new Error("not implemented");
});
const TYPE_ORDER = {
  datetime: 1,
  number: 2,
  string: 3,
  boolean: 4
};
function partialCompare(a, b) {
  const aType = shared.getType(a), bType = shared.getType(b);
  if (aType !== bType)
    return null;
  switch (aType) {
    case "number":
    case "boolean":
      return a - b;
    case "string":
      return a < b ? -1 : a > b ? 1 : 0;
    case "datetime":
      return a.compareTo(b);
    default:
      return null;
  }
}
function totalCompare(a, b) {
  const aType = shared.getType(a), bType = shared.getType(b), aTypeOrder = TYPE_ORDER[aType] || 100, bTypeOrder = TYPE_ORDER[bType] || 100;
  if (aTypeOrder !== bTypeOrder)
    return aTypeOrder - bTypeOrder;
  let result = partialCompare(a, b);
  return result === null && (result = 0), result;
}
class Scope {
  params;
  source;
  value;
  parent;
  context;
  isHidden = !1;
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(params, source, value, context, parent) {
    this.params = params, this.source = source, this.value = value, this.context = context, this.parent = parent;
  }
  createNested(value) {
    return this.isHidden ? new Scope(this.params, this.source, value, this.context, this.parent) : new Scope(this.params, this.source, value, this.context, this);
  }
  createHidden(value) {
    const result = this.createNested(value);
    return result.isHidden = !0, result;
  }
}
const BM25k = 1.2;
async function evaluateScoreAsync(node, scope) {
  if (node.type === "OpCall" && node.op === "match")
    return evaluateMatchScoreAsync(node.left, node.right, scope);
  if (node.type === "FuncCall" && node.name === "boost") {
    const innerScore = await evaluateScoreAsync(node.args[0], scope), boost = await executeAsync(node.args[1], scope);
    return boost.type === "number" && innerScore > 0 ? innerScore + boost.data : 0;
  }
  switch (node.type) {
    case "Or": {
      const leftScore = await evaluateScoreAsync(node.left, scope), rightScore = await evaluateScoreAsync(node.right, scope);
      return leftScore + rightScore;
    }
    case "And": {
      const leftScore = await evaluateScoreAsync(node.left, scope), rightScore = await evaluateScoreAsync(node.right, scope);
      return leftScore === 0 || rightScore === 0 ? 0 : leftScore + rightScore;
    }
    default: {
      const res = await executeAsync(node, scope);
      return res.type === "boolean" && res.data === !0 ? 1 : 0;
    }
  }
}
function evaluateScoreSync(node, scope) {
  if (node.type === "OpCall" && node.op === "match")
    return evaluateMatchScoreSync(node.left, node.right, scope);
  if (node.type === "FuncCall" && node.name === "boost") {
    const innerScore = evaluateScoreSync(node.args[0], scope), boost = executeSync(node.args[1], scope);
    return boost.type === "number" && innerScore > 0 ? innerScore + boost.data : 0;
  }
  switch (node.type) {
    case "Or": {
      const leftScore = evaluateScoreSync(node.left, scope), rightScore = evaluateScoreSync(node.right, scope);
      return leftScore + rightScore;
    }
    case "And": {
      const leftScore = evaluateScoreSync(node.left, scope), rightScore = evaluateScoreSync(node.right, scope);
      return leftScore === 0 || rightScore === 0 ? 0 : leftScore + rightScore;
    }
    default: {
      const res = executeSync(node, scope);
      return res.type === "boolean" && res.data === !0 ? 1 : 0;
    }
  }
}
function evaluateMatchScoreSync(left, right, scope) {
  const text2 = executeSync(left, scope), pattern = executeSync(right, scope), result = processMatchScore(text2, pattern);
  if (typeof result == "number") return result;
  throw new Error("Found synchronous value in match()");
}
async function evaluateMatchScoreAsync(left, right, scope) {
  const text2 = await executeAsync(left, scope), pattern = await executeAsync(right, scope);
  return processMatchScore(text2, pattern);
}
function processMatchScore(text2, pattern) {
  const tokens = shared.gatherText(text2, (part) => shared.matchTokenize(part)), terms = shared.gatherText(pattern, (part) => shared.matchPatternRegex(part)), process = (tokens2, terms2) => {
    if (!terms2.success || tokens2.parts.length === 0 || terms2.parts.length === 0)
      return 0;
    let score = 0;
    for (const re of terms2.parts) {
      const freq = tokens2.parts.reduce((c, token) => c + (re.test(token) ? 1 : 0), 0);
      score += freq * (BM25k + 1) / (freq + BM25k);
    }
    return score;
  };
  return "then" in tokens || "then" in terms ? (async () => process(await tokens, await terms))() : process(tokens, terms);
}
function extractOrderArgs(args) {
  const mappers = [], directions = [];
  for (let mapper of args) {
    let direction = "asc";
    mapper.type === "Desc" ? (direction = "desc", mapper = mapper.base) : mapper.type === "Asc" && (mapper = mapper.base), mappers.push(mapper), directions.push(direction);
  }
  return { mappers, directions };
}
function sortArray(aux, directions) {
  return aux.sort((aTuple, bTuple) => {
    for (let i = 0; i < directions.length; i++) {
      let c = totalCompare(aTuple[i + 2], bTuple[i + 2]);
      if (directions[i] === "desc" && (c = -c), c !== 0)
        return c;
    }
    return aTuple[1] - bTuple[1];
  }), aux.map((v) => v[0]);
}
const pipeFunctions = {};
pipeFunctions.order = {
  executeSync({ base, args }, scope) {
    const { mappers, directions } = extractOrderArgs(args), aux = [];
    let idx = 0;
    const n = directions.length;
    for (const value of base.data) {
      const newScope = scope.createNested(shared.fromJS(value)), tuple = [value, idx];
      for (let i = 0; i < n; i++) {
        const result = executeSync(mappers[i], newScope);
        tuple.push(result.data);
      }
      aux.push(tuple), idx++;
    }
    return shared.fromArray(sortArray(aux, directions));
  },
  async executeAsync({ base, args }, scope) {
    const { mappers, directions } = extractOrderArgs(args), aux = [];
    let idx = 0;
    const n = directions.length;
    for await (const value of base) {
      const newScope = scope.createNested(value), tuple = [await value.get(), idx];
      for (let i = 0; i < n; i++) {
        const result = await executeAsync(mappers[i], newScope);
        tuple.push(await result.get());
      }
      aux.push(tuple), idx++;
    }
    return shared.fromArray(sortArray(aux, directions));
  }
};
pipeFunctions.score = {
  async executeAsync({ base, args }, scope) {
    const unknown = [], scored = [];
    for await (const value of base) {
      if (value.type !== "object") {
        unknown.push(await value.get());
        continue;
      }
      const newScope = scope.createNested(value);
      let valueScore = typeof value.data._score == "number" ? value.data._score : 0;
      for (const arg of args)
        valueScore += await evaluateScoreAsync(arg, newScope);
      const newObject = Object.assign({}, value.data, { _score: valueScore });
      scored.push(newObject);
    }
    return scored.sort((a, b) => b._score - a._score), shared.fromJS(scored);
  },
  executeSync({ base, args }, scope) {
    const scored = [];
    for (const value of base.data) {
      if (shared.getType(value) !== "object")
        continue;
      const valueObj = value, newScope = scope.createNested(shared.fromJS(value));
      let valueScore = typeof valueObj._score == "number" ? valueObj._score : 0;
      for (const arg of args)
        valueScore += evaluateScoreSync(arg, newScope);
      const newObject = Object.assign({}, valueObj, { _score: valueScore });
      scored.push(newObject);
    }
    return scored.sort((a, b) => b._score - a._score), shared.fromArray(scored);
  }
};
const namespaces = {
  global: _global,
  string,
  array,
  pt,
  delta,
  diff,
  media,
  sanity,
  math,
  dateTime,
  releases,
  text,
  geo,
  documents,
  user
}, operators = {
  "==": function(left, right) {
    return isEqual(left, right) ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  },
  "!=": function(left, right) {
    return isEqual(left, right) ? shared.FALSE_VALUE : shared.TRUE_VALUE;
  },
  ">": function(left, right) {
    if (left.type === "stream" || right.type === "stream") return shared.NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? shared.NULL_VALUE : result > 0 ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  },
  ">=": function(left, right) {
    if (left.type === "stream" || right.type === "stream") return shared.NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? shared.NULL_VALUE : result >= 0 ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  },
  "<": function(left, right) {
    if (left.type === "stream" || right.type === "stream") return shared.NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? shared.NULL_VALUE : result < 0 ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  },
  "<=": function(left, right) {
    if (left.type === "stream" || right.type === "stream") return shared.NULL_VALUE;
    const result = partialCompare(left.data, right.data);
    return result === null ? shared.NULL_VALUE : result <= 0 ? shared.TRUE_VALUE : shared.FALSE_VALUE;
  },
  // eslint-disable-next-line func-name-matching
  in: function(left, right) {
    if (right.type === "path")
      return left.type !== "string" ? shared.NULL_VALUE : right.data.matches(left.data) ? shared.TRUE_VALUE : shared.FALSE_VALUE;
    if (right.type === "array") {
      for (const b of right.data)
        if (isEqual(left, shared.fromJS(b)))
          return shared.TRUE_VALUE;
      return shared.FALSE_VALUE;
    }
    return right.type === "stream" ? (async () => {
      for await (const b of right)
        if (isEqual(left, b))
          return shared.TRUE_VALUE;
      return shared.FALSE_VALUE;
    })() : shared.NULL_VALUE;
  },
  match: function(left, right) {
    const tokens = shared.gatherText(left, (part) => shared.matchTokenize(part)), patterns = shared.gatherText(right, (part) => shared.matchAnalyzePattern(part)), process = (tokens2, patterns2) => patterns2.success && shared.matchText(tokens2.parts, patterns2.parts) ? shared.TRUE_VALUE : shared.FALSE_VALUE;
    return "then" in tokens || "then" in patterns ? (async () => process(await tokens, await patterns))() : process(tokens, patterns);
  },
  "+": function(left, right) {
    return left.type === "datetime" && right.type === "number" ? shared.fromDateTime(left.data.add(right.data)) : left.type === "number" && right.type === "datetime" ? shared.fromDateTime(right.data.add(left.data)) : left.type === "number" && right.type === "number" ? shared.fromNumber(left.data + right.data) : left.type === "string" && right.type === "string" ? shared.fromString(left.data + right.data) : left.type === "object" && right.type === "object" ? shared.fromJS({ ...left.data, ...right.data }) : left.type === "array" && right.type === "array" ? shared.fromJS(left.data.concat(right.data)) : left.isArray() && right.isArray() ? new shared.StreamValue(async function* () {
      for await (const val of left)
        yield val;
      for await (const val of right)
        yield val;
    }) : shared.NULL_VALUE;
  },
  "-": function(left, right) {
    return left.type === "datetime" && right.type === "number" ? shared.fromDateTime(left.data.add(-right.data)) : left.type === "datetime" && right.type === "datetime" ? shared.fromNumber(left.data.difference(right.data)) : left.type === "number" && right.type === "number" ? shared.fromNumber(left.data - right.data) : shared.NULL_VALUE;
  },
  "*": numericOperator((a, b) => a * b),
  "/": numericOperator((a, b) => a / b),
  "%": numericOperator((a, b) => a % b),
  "**": numericOperator((a, b) => Math.pow(a, b))
};
function numericOperator(impl) {
  return function(left, right) {
    if (left.type === "number" && right.type === "number") {
      const result = impl(left.data, right.data);
      return shared.fromNumber(result);
    }
    return shared.NULL_VALUE;
  };
}
function evaluate(node, scope) {
  return executeAsync(node, scope);
}
function executeSync(node, scope) {
  return EXECUTORS[node.type].executeSync(node, scope);
}
function executeAsync(node, scope) {
  return EXECUTORS[node.type].executeAsync(node, scope);
}
function asyncOnlyExecutor(executeAsync2) {
  return {
    executeSync() {
      throw new Error("executeSync not supported");
    },
    executeAsync: executeAsync2
  };
}
function constantExecutor(fn) {
  return {
    executeSync(node, scope) {
      const value = fn(node, scope);
      if (value.type === "stream") throw new Error("Stream encountered in evaluateSync");
      return value;
    },
    async executeAsync(node, scope) {
      return fn(node, scope);
    }
  };
}
function mappedExecutor(map, reduce) {
  return {
    executeSync(node, scope) {
      const values = map(node).map((node2) => executeSync(node2, scope)), value = reduce(node, ...values);
      if (value.type === "stream")
        throw new Error("Stream/iterator not supported in synchronous mode");
      return value;
    },
    async executeAsync(node, scope) {
      const nodes = map(node), values = await Promise.all(
        nodes.map((node2) => executeAsync(node2, scope).then((value) => value.asStatic()))
      );
      return reduce(node, ...values);
    }
  };
}
const STOP_ITERATOR = /* @__PURE__ */ Symbol();
function arrayReducerExecutor(map, init, reduce, wrap) {
  return {
    executeSync(node, scope) {
      const { array: arrayNode, args: argNodes = [] } = map(node), arr = executeSync(arrayNode, scope);
      if (arr.type !== "array") return shared.NULL_VALUE;
      const args = argNodes.map((node2) => executeSync(node2, scope));
      let state = init(node, ...args);
      for (const item of arr.data) {
        const result = reduce(node, state, item, ...args);
        if (result === STOP_ITERATOR) return shared.NULL_VALUE;
        state = result;
      }
      return wrap(state);
    },
    async executeAsync(node, scope) {
      const { array: arrayNode, args: argNodes = [] } = map(node), arr = await executeAsync(arrayNode, scope);
      if (arr.type !== "array" && arr.type !== "stream") return shared.NULL_VALUE;
      const args = await Promise.all(
        argNodes.map((node2) => executeAsync(node2, scope).then((v) => v.asStatic()))
      );
      let state = init(node, ...args);
      if (arr.type === "stream")
        for await (const item of arr) {
          const result = reduce(node, state, await item.get(), ...args);
          if (result === STOP_ITERATOR) return shared.NULL_VALUE;
          state = result;
        }
      else
        for (const item of arr.data) {
          const result = reduce(node, state, item, ...args);
          if (result === STOP_ITERATOR) return shared.NULL_VALUE;
          state = result;
        }
      return wrap(state);
    }
  };
}
function arrayExecutor(map, reduce, { hidden = !1 } = {}) {
  return {
    executeSync(node, scope) {
      const mapping = map(node), arr = executeSync(mapping.array, scope);
      if (arr.type !== "array") return shared.NULL_VALUE;
      const result = [];
      for (const item of arr.data) {
        let inner;
        if (mapping.inner) {
          const newScope = hidden ? scope.createHidden(shared.fromJS(item)) : scope.createNested(shared.fromJS(item));
          inner = executeSync(mapping.inner, newScope).data;
        }
        for (const entry of reduce(node, item, inner, mapping.state))
          result.push(entry);
      }
      return shared.fromArray(result);
    },
    async executeAsync(node, scope) {
      const mapping = map(node), arr = await executeAsync(mapping.array, scope);
      return arr.isArray() ? new shared.StreamValue(async function* () {
        for await (const item of arr) {
          let inner;
          if (mapping.inner) {
            const newScope = hidden ? scope.createHidden(item) : scope.createNested(item);
            inner = await (await executeAsync(mapping.inner, newScope)).get();
          }
          for (const entry of reduce(node, await item.get(), inner, mapping.state))
            yield shared.fromJS(entry);
        }
      }) : shared.NULL_VALUE;
    }
  };
}
const EXECUTORS = {
  This: constantExecutor((_, scope) => scope.value),
  SelectorNested: constantExecutor(() => {
    throw new Error("Unexpected node type: SelectorNested");
  }),
  SelectorFuncCall: constantExecutor(() => {
    throw new Error("Unexpected node type: SelectorFuncCall");
  }),
  Everything: constantExecutor((_, scope) => scope.source),
  Parameter: constantExecutor(({ name }, scope) => shared.fromJS(scope.params[name])),
  Context: constantExecutor(({ key }, scope) => {
    if (key === "before" || key === "after")
      return scope.context[key] || shared.NULL_VALUE;
    throw new Error(`unknown context key: ${key}`);
  }),
  Parent: constantExecutor(({ n }, scope) => {
    let current = scope;
    for (let i = 0; i < n; i++) {
      if (!current.parent)
        return shared.NULL_VALUE;
      current = current.parent;
    }
    return current.value;
  }),
  OpCall: {
    async executeAsync({ op, left, right }, scope) {
      const func = operators[op];
      if (!func)
        throw new Error(`Unknown operator: ${op}`);
      const leftValue = await executeAsync(left, scope), rightValue = await executeAsync(right, scope);
      return func(leftValue, rightValue);
    },
    executeSync({ op, left, right }, scope) {
      const func = operators[op];
      if (!func)
        throw new Error(`Unknown operator: ${op}`);
      const leftValue = executeSync(left, scope), rightValue = executeSync(right, scope), result = func(leftValue, rightValue);
      if ("then" in result || result.type === "stream")
        throw new Error(`Operator ${op} not possible in evaluteSync`);
      return result;
    }
  },
  Select: {
    executeSync({ alternatives, fallback }, scope) {
      for (const alt of alternatives) {
        const altCond = executeSync(alt.condition, scope);
        if (altCond.type === "boolean" && altCond.data === !0)
          return executeSync(alt.value, scope);
      }
      return fallback ? executeSync(fallback, scope) : shared.NULL_VALUE;
    },
    async executeAsync({ alternatives, fallback }, scope) {
      for (const alt of alternatives) {
        const altCond = await executeAsync(alt.condition, scope);
        if (altCond.type === "boolean" && altCond.data === !0)
          return executeAsync(alt.value, scope);
      }
      return fallback ? executeAsync(fallback, scope) : shared.NULL_VALUE;
    }
  },
  InRange: mappedExecutor(
    ({ base, left, right }) => [base, left, right],
    ({ isInclusive }, value, leftValue, rightValue) => {
      const leftCmp = partialCompare(value.data, leftValue.data);
      if (leftCmp === null)
        return shared.NULL_VALUE;
      const rightCmp = partialCompare(value.data, rightValue.data);
      return rightCmp === null ? shared.NULL_VALUE : isInclusive ? leftCmp >= 0 && rightCmp <= 0 ? shared.TRUE_VALUE : shared.FALSE_VALUE : leftCmp >= 0 && rightCmp < 0 ? shared.TRUE_VALUE : shared.FALSE_VALUE;
    }
  ),
  Filter: arrayExecutor(
    ({ base, expr }) => ({ array: base, inner: expr }),
    function* (_, elem, inner) {
      inner === !0 && (yield elem);
    }
  ),
  Projection: {
    executeSync({ base, expr }, scope) {
      const baseValue = executeSync(base, scope);
      if (baseValue.type !== "object")
        return shared.NULL_VALUE;
      const newScope = scope.createNested(baseValue);
      return executeSync(expr, newScope);
    },
    async executeAsync({ base, expr }, scope) {
      const baseValue = await executeAsync(base, scope);
      if (baseValue.type !== "object")
        return shared.NULL_VALUE;
      const newScope = scope.createNested(baseValue);
      return executeAsync(expr, newScope);
    }
  },
  FuncCall: {
    executeAsync({ namespace, name, args }, scope) {
      const func = namespaces[namespace]?.[name];
      if (!func) throw new Error(`Unknown function: ${namespace}::${name}`);
      return func.executeAsync(args, scope);
    },
    executeSync({ namespace, name, args }, scope) {
      const func = namespaces[namespace]?.[name];
      if (!func) throw new Error(`Unknown function: ${namespace}::${name}`);
      return func.executeSync(args, scope);
    }
  },
  PipeFuncCall: {
    async executeAsync({ name, base, args }, scope) {
      const func = pipeFunctions[name];
      if (!func) throw new Error(`Unknown pipe function: ${name}`);
      const baseValue = await executeAsync(base, scope);
      return baseValue.type !== "stream" && baseValue.type !== "array" ? shared.NULL_VALUE : func.executeAsync({ base: baseValue, args }, scope);
    },
    executeSync({ name, base, args }, scope) {
      const func = pipeFunctions[name];
      if (!func) throw new Error(`Unknown pipe function: ${name}`);
      const baseValue = executeSync(base, scope);
      return baseValue.type !== "array" ? shared.NULL_VALUE : func.executeSync({ base: baseValue, args }, scope);
    }
  },
  AccessAttribute: mappedExecutor(
    ({ base }) => [base || { type: "This" }],
    ({ name }, value) => value.type === "object" && value.data.hasOwnProperty(name) ? shared.fromJS(value.data[name]) : shared.NULL_VALUE
  ),
  AccessElement: mappedExecutor(
    ({ base }) => [base],
    ({ index }, baseValue) => {
      if (baseValue.type !== "array") return shared.NULL_VALUE;
      const data = baseValue.data, finalIndex = index < 0 ? index + data.length : index;
      return shared.fromJS(data[finalIndex]);
    }
  ),
  Slice: mappedExecutor(
    ({ base }) => [base],
    ({ left, right, isInclusive }, baseValue) => {
      if (baseValue.type !== "array")
        return shared.NULL_VALUE;
      const array2 = baseValue.data;
      let leftIdx = left, rightIdx = right;
      return leftIdx < 0 && (leftIdx = array2.length + leftIdx), rightIdx < 0 && (rightIdx = array2.length + rightIdx), isInclusive && rightIdx++, leftIdx < 0 && (leftIdx = 0), rightIdx < 0 && (rightIdx = 0), shared.fromArray(array2.slice(leftIdx, rightIdx));
    }
  ),
  Deref: {
    executeSync({ base }, scope) {
      const value = executeSync(base, scope);
      if (value.type !== "object")
        return shared.NULL_VALUE;
      const id = value.data._ref;
      if (typeof id != "string")
        return shared.NULL_VALUE;
      if (scope.context.dereference) {
        const value2 = scope.context.dereference({ _ref: id });
        if (value2 && typeof value2 == "object" && "then" in value2)
          throw new Error("Dereference returned promise in synchronous mode");
        return shared.fromJS(value2);
      }
      if (scope.source.type !== "array")
        return shared.NULL_VALUE;
      for (const doc of scope.source.data)
        if (doc && typeof doc == "object" && "_id" in doc && id === doc._id)
          return shared.fromJS(doc);
      return shared.NULL_VALUE;
    },
    async executeAsync({ base }, scope) {
      const value = await executeAsync(base, scope);
      if (!scope.source.isArray() || value.type !== "object")
        return shared.NULL_VALUE;
      const id = value.data._ref;
      if (typeof id != "string")
        return shared.NULL_VALUE;
      if (scope.context.dereference)
        return shared.fromJS(await scope.context.dereference({ _ref: id }));
      for await (const doc of scope.source)
        if (doc.type === "object" && id === doc.data._id)
          return doc;
      return shared.NULL_VALUE;
    }
  },
  Value: constantExecutor(({ value }) => shared.fromJS(value)),
  Group: {
    executeSync({ base }, scope) {
      return executeSync(base, scope);
    },
    executeAsync({ base }, scope) {
      return executeAsync(base, scope);
    }
  },
  Object: {
    executeSync({ attributes }, scope) {
      const result = {};
      for (const attr of attributes) {
        const attrType = attr.type;
        switch (attr.type) {
          case "ObjectAttributeValue": {
            const value = executeSync(attr.value, scope);
            result[attr.name] = value.data;
            break;
          }
          case "ObjectConditionalSplat": {
            const cond = executeSync(attr.condition, scope);
            if (cond.type !== "boolean" || cond.data === !1)
              continue;
            const value = executeSync(attr.value, scope);
            value.type === "object" && Object.assign(result, value.data);
            break;
          }
          case "ObjectSplat": {
            const value = executeSync(attr.value, scope);
            value.type === "object" && Object.assign(result, value.data);
            break;
          }
          default:
            throw new Error(`Unknown node type: ${attrType}`);
        }
      }
      return shared.fromJS(result);
    },
    async executeAsync({ attributes }, scope) {
      const result = {};
      for (const attr of attributes) {
        const attrType = attr.type;
        switch (attr.type) {
          case "ObjectAttributeValue": {
            const value = await executeAsync(attr.value, scope);
            result[attr.name] = await value.get();
            break;
          }
          case "ObjectConditionalSplat": {
            const cond = await executeAsync(attr.condition, scope);
            if (cond.type !== "boolean" || cond.data === !1)
              continue;
            const value = await executeAsync(attr.value, scope);
            value.type === "object" && Object.assign(result, value.data);
            break;
          }
          case "ObjectSplat": {
            const value = await executeAsync(attr.value, scope);
            value.type === "object" && Object.assign(result, value.data);
            break;
          }
          default:
            throw new Error(`Unknown node type: ${attrType}`);
        }
      }
      return shared.fromJS(result);
    }
  },
  Array: {
    executeSync({ elements }, scope) {
      const result = [];
      for (const element of elements) {
        const value = executeSync(element.value, scope);
        if (element.isSplat) {
          if (value.type === "array")
            for (const v of value.data)
              result.push(v);
        } else
          result.push(value.data);
      }
      return shared.fromArray(result);
    },
    async executeAsync({ elements }, scope) {
      return new shared.StreamValue(async function* () {
        for (const element of elements) {
          const value = await executeAsync(element.value, scope);
          if (element.isSplat) {
            if (value.isArray())
              for await (const v of value)
                yield v;
          } else
            yield value;
        }
      });
    }
  },
  Tuple: constantExecutor(() => {
    throw new Error("tuples can not be evaluated");
  }),
  Or: mappedExecutor(
    ({ left, right }) => [left, right],
    (_, leftValue, rightValue) => leftValue.type === "boolean" && leftValue.data === !0 || rightValue.type === "boolean" && rightValue.data === !0 ? shared.TRUE_VALUE : leftValue.type !== "boolean" || rightValue.type !== "boolean" ? shared.NULL_VALUE : shared.FALSE_VALUE
  ),
  And: mappedExecutor(
    ({ left, right }) => [left, right],
    (_, leftValue, rightValue) => leftValue.type === "boolean" && leftValue.data === !1 || rightValue.type === "boolean" && rightValue.data === !1 ? shared.FALSE_VALUE : leftValue.type !== "boolean" || rightValue.type !== "boolean" ? shared.NULL_VALUE : shared.TRUE_VALUE
  ),
  Not: mappedExecutor(
    ({ base }) => [base],
    (_, value) => value.type !== "boolean" ? shared.NULL_VALUE : value.data ? shared.FALSE_VALUE : shared.TRUE_VALUE
  ),
  Neg: mappedExecutor(
    ({ base }) => [base],
    (_, value) => value.type !== "number" ? shared.NULL_VALUE : shared.fromNumber(-value.data)
  ),
  Pos: mappedExecutor(
    ({ base }) => [base],
    (_, value) => value.type !== "number" ? shared.NULL_VALUE : shared.fromNumber(value.data)
  ),
  Asc: constantExecutor(() => shared.NULL_VALUE),
  Desc: constantExecutor(() => shared.NULL_VALUE),
  ArrayCoerce: {
    executeSync({ base }, scope) {
      const value = executeSync(base, scope);
      return value.isArray() ? value : shared.NULL_VALUE;
    },
    async executeAsync({ base }, scope) {
      const value = await executeAsync(base, scope);
      return value.isArray() ? value : shared.NULL_VALUE;
    }
  },
  Map: arrayExecutor(
    ({ base, expr }) => ({ array: base, inner: expr }),
    function* (_, _item, inner) {
      yield inner;
    },
    { hidden: !0 }
  ),
  FlatMap: arrayExecutor(
    ({ base, expr }) => ({ array: base, inner: expr }),
    function* (_, _item, inner) {
      if (Array.isArray(inner))
        for (const innerInner of inner)
          yield innerInner;
      else
        yield inner;
    },
    { hidden: !0 }
  )
};
function evaluateQuery(tree, options = {}) {
  return executeAsync(tree, scopeFromOptions(options));
}
function evaluateQuerySync(tree, options = {}) {
  return executeSync(tree, scopeFromOptions(options));
}
function scopeFromOptions(options) {
  const root = shared.fromJS(options.root), dataset = shared.fromJS(options.dataset), params = { ...options.params };
  return new Scope(
    params,
    dataset,
    root,
    {
      timestamp: options.timestamp || /* @__PURE__ */ new Date(),
      identity: options.identity === void 0 ? "me" : options.identity,
      sanity: options.sanity,
      after: options.after ? shared.fromJS(options.after) : null,
      before: options.before ? shared.fromJS(options.before) : null,
      dereference: options.dereference
    },
    null
  );
}
exports.evaluateQuery = evaluateQuery;
exports.evaluateQuerySync = evaluateQuerySync;
//# sourceMappingURL=evaluator.js.map

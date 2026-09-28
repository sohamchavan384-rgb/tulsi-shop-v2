function createCursor({
  values,
  fallback,
  validator: validate
}) {
  let position = 0;
  function peek(offset = 0) {
    return values[position + offset] ?? fallback;
  }
  function consume(expected) {
    const current = peek();
    return typeof expected < "u" && validate(expected, current, position), position++, current;
  }
  function hasNext() {
    return position < values.length;
  }
  return Object.defineProperty(peek, "position", { get: () => position }), Object.assign(peek, { hasNext, consume });
}
function tokenize(expression) {
  return tokenizePathExpression(
    createCursor({
      values: expression,
      fallback: "",
      validator: (expected, value, position) => {
        if (typeof expected == "string" && expected !== value)
          throw new SyntaxError(
            `Expected \`${expected}\` at position ${position}${value ? ` but got \`${value}\` instead` : ""}`
          );
        if (expected instanceof RegExp && !expected.test(value))
          throw new SyntaxError(
            `Expected character \`${value}\` at position ${position} to match ${expected}`
          );
      }
    })
  );
}
function tokenizePathExpression(cursor) {
  const tokens = [];
  for (; cursor.hasNext(); ) {
    const char = cursor(), position = cursor.position;
    if (/\s/.test(char)) {
      cursor.consume();
      continue;
    }
    switch (char) {
      case '"': {
        tokens.push(parseStringLiteral(cursor));
        continue;
      }
      case "'": {
        tokens.push(parseQuotedIdentifier(cursor));
        continue;
      }
      case "[":
      case "]":
      case ",":
      case ":":
      case "?":
      case "*": {
        cursor.consume(), tokens.push({ type: char, position });
        continue;
      }
      case "$":
      case "@": {
        if (/[a-zA-Z_$]/.test(cursor(1))) {
          tokens.push(parseIdentifier(cursor));
          continue;
        }
        cursor.consume(), tokens.push({ type: "This", position });
        continue;
      }
      case ".": {
        if (cursor.consume(), cursor() === ".") {
          cursor.consume(), tokens.push({ type: "..", position });
          continue;
        }
        tokens.push({ type: ".", position });
        continue;
      }
      case "=":
      case "!":
      case ">":
      case "<": {
        tokens.push(parseOperator(cursor));
        continue;
      }
      default: {
        if (/[0-9]/.test(char) || char === "-" && /[0-9]/.test(cursor(1))) {
          tokens.push(parseNumber(cursor));
          continue;
        }
        if (/[a-zA-Z_$]/.test(char)) {
          tokens.push(parseIdentifierOrBoolean(cursor));
          continue;
        }
        throw new Error(`Unexpected character '${char}' at position ${position}`);
      }
    }
  }
  return tokens.push({ type: "EOF", position: cursor.position }), tokens;
}
function parseStringLiteral(cursor) {
  const position = cursor.position;
  let value = "";
  for (cursor.consume('"'); cursor.hasNext() && cursor() !== '"'; )
    cursor() === "\\" ? value += parseEscapeSequence(cursor) : value += cursor.consume();
  return cursor.consume('"'), { type: "String", value, position };
}
function parseQuotedIdentifier(cursor) {
  const position = cursor.position;
  let value = "";
  for (cursor.consume("'"); cursor.hasNext() && cursor() !== "'"; )
    cursor() === "\\" ? value += parseEscapeSequence(cursor) : value += cursor.consume();
  return cursor.consume("'"), { type: "Identifier", value, position };
}
function parseIdentifier(cursor) {
  const position = cursor.position;
  let value = "";
  for (value += cursor.consume(/[a-zA-Z_$]/); /[a-zA-Z0-9_$]/.test(cursor()); )
    value += cursor.consume();
  return { type: "Identifier", value, position };
}
function parseIdentifierOrBoolean(cursor) {
  const position = cursor.position;
  let value = "";
  for (value += cursor.consume(/[a-zA-Z_$]/); /[a-zA-Z0-9_$]/.test(cursor()); )
    value += cursor.consume();
  return value === "null" ? { type: "Null", position } : value === "true" ? { type: "Boolean", value: !0, position } : value === "false" ? { type: "Boolean", value: !1, position } : { type: "Identifier", value, position };
}
function parseEscapeSequence(cursor) {
  cursor.consume("\\");
  const escaped = cursor.consume();
  switch (escaped) {
    case '"':
    case "'":
    case "\\":
    case "/":
      return escaped;
    case "b":
      return "\b";
    case "f":
      return "\f";
    case "n":
      return `
`;
    case "r":
      return "\r";
    case "t":
      return "	";
    case "u": {
      let unicode = "";
      for (let i = 0; i < 4; i++)
        unicode += cursor.consume(/[0-9a-fA-F]/);
      return String.fromCharCode(parseInt(unicode, 16));
    }
    default:
      throw new Error(`Invalid escape sequence \\${escaped} at position ${cursor.position - 1}`);
  }
}
function parseOperator(cursor) {
  const position = cursor.position, char = cursor(), next = cursor(1);
  if (char === "=" && next === "=")
    return cursor.consume(), cursor.consume(), { type: "Operator", value: "==", position };
  if (char === "!" && next === "=")
    return cursor.consume(), cursor.consume(), { type: "Operator", value: "!=", position };
  if (char === ">" && next === "=")
    return cursor.consume(), cursor.consume(), { type: "Operator", value: ">=", position };
  if (char === "<" && next === "=")
    return cursor.consume(), cursor.consume(), { type: "Operator", value: "<=", position };
  if (char === ">")
    return cursor.consume(), { type: "Operator", value: ">", position };
  if (char === "<")
    return cursor.consume(), { type: "Operator", value: "<", position };
  throw new SyntaxError(`Invalid operator at position ${position}`);
}
function parseNumber(cursor) {
  const position = cursor.position;
  let value = "";
  for (cursor() === "-" && (value += cursor.consume()); /[0-9]/.test(cursor()); )
    value += cursor.consume();
  if (cursor() === "." && /[0-9]/.test(cursor(1)))
    for (value += cursor.consume(); /[0-9]/.test(cursor()); )
      value += cursor.consume();
  return { type: "Number", value: parseFloat(value), position };
}
class UnexpectedTokenError extends SyntaxError {
  constructor(token, expected) {
    super(
      expected ? `Expected ${expected} at position ${token.position} but got ${token.type} instead` : `Unexpected token ${token.type} at position ${token.position}`
    );
  }
}
function parse(query) {
  const tokens = tokenize(query);
  if (tokens.length <= 1) throw new SyntaxError("Empty expression");
  const eof = tokens.at(-1);
  if (eof.type !== "EOF")
    throw new UnexpectedTokenError(eof);
  const cursor = createCursor({
    values: tokens,
    fallback: eof,
    validator: (expectedTokenType, token) => {
      if (token.type !== expectedTokenType)
        throw new UnexpectedTokenError(token, expectedTokenType);
    }
  }), ast = parseExpression(cursor);
  return cursor.consume("EOF"), ast;
}
function parseExpression(cursor) {
  switch (cursor().type) {
    // Path openers
    case "This":
    case "Identifier":
    case "*":
    case "[":
    case ".":
    case "..":
      return parsePath$1(cursor);
    case "String": {
      const { value } = cursor.consume("String");
      return { type: "String", value };
    }
    case "Number": {
      const { value } = cursor.consume("Number");
      return { type: "Number", value };
    }
    case "Boolean": {
      const { value } = cursor.consume("Boolean");
      return { type: "Boolean", value };
    }
    case "Null":
      return cursor.consume("Null"), { type: "Null" };
    default:
      throw new UnexpectedTokenError(cursor());
  }
}
function parsePath$1(cursor) {
  let result;
  if (cursor().type === "." || cursor().type === "..") {
    const recursive = cursor().type === "..";
    if (cursor.consume(), cursor().type === "EOF" || cursor().type === "]" || cursor().type === ",")
      if (recursive)
        result = {
          type: "Path",
          base: {
            type: "Path",
            segment: { type: "This" }
          },
          recursive,
          segment: { type: "Wildcard" }
        };
      else
        throw new UnexpectedTokenError(cursor(), "Path Segment");
    else {
      const segment = parsePathSegment(cursor);
      result = {
        type: "Path",
        base: {
          type: "Path",
          segment: { type: "This" }
        },
        recursive,
        segment
      };
    }
  } else
    result = { type: "Path", segment: parsePathSegment(cursor) };
  for (; ; ) {
    if (cursor().type === "[") {
      const subscript = parseSubscript(cursor);
      result = {
        type: "Path",
        base: result,
        recursive: !1,
        segment: subscript
      };
      continue;
    }
    if (cursor().type === "." || cursor().type === "..") {
      const recursive = cursor().type === "..";
      cursor.consume();
      const segment = parsePathSegment(cursor);
      result = {
        type: "Path",
        base: result,
        recursive,
        segment
      };
      continue;
    }
    break;
  }
  return result;
}
function parsePathSegment(cursor) {
  const next = cursor();
  if (next.type === "This")
    return cursor.consume(), { type: "This" };
  if (next.type === "Identifier")
    return cursor.consume(), { type: "Identifier", name: next.value };
  if (next.type === "*")
    return cursor.consume(), { type: "Wildcard" };
  if (next.type === "[")
    return parseSubscript(cursor);
  throw new UnexpectedTokenError(next, "Path Segment");
}
function parseSubscript(cursor) {
  const elements = [];
  for (cursor.consume("["), elements.push(parseSubscriptElement(cursor)); cursor().type === ","; )
    cursor.consume(), elements.push(parseSubscriptElement(cursor));
  return cursor.consume("]"), { type: "Subscript", elements };
}
function parseSubscriptElement(cursor) {
  if (cursor().type === ":" || cursor().type === "Number")
    return parseIndexOrSlice(cursor);
  const nestedExpression = parseExpression(cursor);
  if (cursor().type === "Operator") {
    const { value: operator } = cursor.consume("Operator");
    return {
      type: "Comparison",
      left: nestedExpression,
      operator,
      right: parseExpression(cursor)
    };
  }
  return cursor().type === "?" && nestedExpression.type === "Path" ? (cursor.consume(), {
    type: "Existence",
    base: nestedExpression
  }) : nestedExpression;
}
function parseIndexOrSlice(cursor) {
  if (cursor().type === "Number") {
    const { value: start } = cursor.consume("Number");
    if (cursor().type === ":") {
      if (cursor.consume(), cursor().type === "Number") {
        const { value: end } = cursor.consume("Number");
        return { type: "Slice", start, end };
      }
      return { type: "Slice", start };
    }
    return { type: "Number", value: start };
  }
  if (cursor().type === ":") {
    if (cursor.consume(), cursor().type === "Number") {
      const { value: end } = cursor.consume("Number");
      return { type: "Slice", end };
    }
    return { type: "Path", segment: { type: "Wildcard" } };
  }
  throw new UnexpectedTokenError(cursor(), "Number or Slice");
}
function stringifyExpression(node) {
  switch (node.type) {
    case "String":
    case "Number":
    case "Boolean":
      return JSON.stringify(node.value);
    case "Path":
      return stringifyPath$1(node);
    case "Null":
      return "null";
    default:
      throw new Error(
        `Unknown node type: ${// @ts-expect-error should be `never` type
        node.type}`
      );
  }
}
function stringifyPath$1(node) {
  if (!node) return "";
  const base = stringifyPath$1(node.base), segment = stringifySegment(node.segment);
  return node.recursive ? `${base}..${segment}` : base ? segment.startsWith("[") ? `${base}${segment}` : `${base}.${segment}` : segment;
}
function stringifySegment(segment) {
  switch (segment.type) {
    case "This":
      return "@";
    case "Wildcard":
      return "*";
    case "Subscript":
      return `[${segment.elements.map(stringifySubscriptElement).join(",")}]`;
    case "Identifier":
      return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment.name) ? segment.name : escapeIdentifier(segment.name);
    default:
      throw new Error(`Unknown segment type: ${segment.type}`);
  }
}
function escapeIdentifier(value) {
  return `'${JSON.stringify(value).slice(1, -1).replace(/'/g, "\\'").replace(/\\"/g, '"')}'`;
}
function stringifySubscriptElement(node) {
  switch (node.type) {
    case "Slice":
      return `${node.start ?? ""}:${node.end ?? ""}`;
    case "Comparison":
      return `${stringifyExpression(node.left)}${node.operator}${stringifyExpression(node.right)}`;
    case "Existence":
      return `${stringifyPath$1(node.base)}?`;
    case "String":
    case "Number":
    case "Boolean":
    case "Null":
    case "Path":
      return stringifyExpression(node);
    default:
      throw new Error(
        `Unknown subscript element type: ${// @ts-expect-error this should be a `never` type
        node.type}`
      );
  }
}
const KEY_PREFIX = "key:", FIELD_PREFIX = "field:", INDEX_PREFIX = "index:";
function createPathSet() {
  const root = /* @__PURE__ */ new Map();
  function getKey(segment) {
    return isKeyedObject(segment) ? `${KEY_PREFIX}${segment._key}` : typeof segment == "string" ? `${FIELD_PREFIX}${segment}` : `${INDEX_PREFIX}${segment}`;
  }
  function add(map, [head, ...tail]) {
    if (typeof head > "u") return;
    const key = getKey(head);
    if (!tail.length) {
      map.set(key, !0);
      return;
    }
    const cached = map.get(key);
    if (typeof cached < "u") {
      if (cached === !0) return;
      add(cached, tail);
      return;
    }
    const next = /* @__PURE__ */ new Map();
    map.set(key, next), add(next, tail);
  }
  function has(map, [head, ...tail]) {
    if (typeof head > "u") return !1;
    const key = getKey(head), cached = map.get(key);
    return typeof cached > "u" ? !1 : tail.length ? cached === !0 ? !1 : has(cached, tail) : cached === !0;
  }
  return {
    add: (path) => add(root, path),
    has: (path) => has(root, path)
  };
}
const INDEX_CACHE = /* @__PURE__ */ new WeakMap();
function isRecord(value) {
  return typeof value == "object" && value !== null && !Array.isArray(value);
}
function isKeyedObject(value) {
  return isRecord(value) && typeof value._key == "string";
}
function stringifyPath(path) {
  return path ? typeof path == "string" ? path : Array.isArray(path) ? stringifyPath(parsePath(path)) : stringifyExpression(path) : "";
}
function getIndexForKey(input, key) {
  if (!Array.isArray(input)) return;
  const cached = INDEX_CACHE.get(input);
  if (cached) return cached[key];
  const lookup = input.reduce((acc, next, index) => (typeof next?._key == "string" && (acc[next._key] = index), acc), {});
  return INDEX_CACHE.set(input, lookup), lookup[key];
}
function parsePath(path) {
  if (Array.isArray(path)) {
    let result;
    for (const segment of path)
      result = {
        type: "Path",
        base: result,
        recursive: !1,
        segment: convertArraySegmentToSegmentNode(segment)
      };
    return result;
  }
  return typeof path == "string" ? parse(path) : path;
}
function convertArraySegmentToSegmentNode(segment) {
  if (Array.isArray(segment)) {
    const [start, end] = segment;
    return { type: "Subscript", elements: [start === "" && end === "" ? { type: "Path", segment: { type: "Wildcard" } } : { type: "Slice", ...start !== "" && { start }, ...end !== "" && { end } }] };
  }
  if (typeof segment == "string")
    return { type: "Identifier", name: segment };
  if (typeof segment == "number")
    return {
      type: "Subscript",
      elements: [{ type: "Number", value: segment }]
    };
  if (isKeyedObject(segment))
    return {
      type: "Subscript",
      elements: [{
        type: "Comparison",
        left: { type: "Path", segment: { type: "Identifier", name: "_key" } },
        operator: "==",
        right: { type: "String", value: segment._key }
      }]
    };
  throw new Error(`Unsupported segment type: ${typeof segment}`);
}
function getPathDepth(path) {
  if (!path) return 0;
  if (Array.isArray(path)) return path.length;
  if (typeof path == "string") return getPathDepth(parsePath(path));
  if (path.type !== "Path") return 0;
  const segmentDepth = path.segment.type === "Subscript" || path.segment.type === "Wildcard" || path.segment.type === "Identifier" ? 1 : 0;
  return getPathDepth(path.base) + segmentDepth;
}
function* drop(values, count) {
  let index = 0;
  for (const value of values)
    index >= count && (yield value), index++;
}
function* getSegments(node) {
  node.base && (yield* getSegments(node.base)), node.segment.type !== "This" && (yield node);
}
function slicePath(path, start, end) {
  if (!path) return "";
  if (typeof path == "string" || Array.isArray(path)) return slicePath(parsePath(path), start, end);
  if (path.type !== "Path") return "";
  const depth = getPathDepth(path);
  if (typeof start > "u" && (start = 0), start < 0 && (start = start + depth), typeof end > "u" && (end = depth), end < 0 && (end = end + depth), start = Math.max(0, Math.min(start, depth)), end = Math.max(0, Math.min(end, depth)), start >= end) return "";
  if (end < depth) return slicePath(path.base, start, end);
  let base;
  for (const segment of drop(getSegments(path), start))
    base = { ...segment, base };
  return stringifyPath(base);
}
function joinPaths(base, path) {
  if (!base) return stringifyPath(path);
  if (Array.isArray(base) || typeof base == "string") return joinPaths(parsePath(base), path);
  if (base.type !== "Path") return stringifyPath(path);
  if (!path) return stringifyPath(base);
  if (Array.isArray(path) || typeof path == "string") return joinPaths(base, parsePath(path));
  if (path.type !== "Path") return stringifyPath(base);
  for (const segment of getSegments(path))
    base = { ...segment, base };
  return stringifyPath(base);
}
const LITERAL_PATH = [];
function* jsonMatch(value, expr, basePath = []) {
  const visited = createPathSet();
  for (const entry of evaluateExpression({ expr: parsePath(expr), value, path: basePath })) {
    const { path } = entry;
    path !== LITERAL_PATH && (visited.has(path) || (visited.add(path), yield entry));
  }
}
const itemEntry = (item, path, index) => ({
  value: item,
  path: [...path, isKeyedObject(item) ? { _key: item._key } : index]
});
function* evaluateExpression({
  expr,
  value,
  path
}) {
  if (expr)
    switch (expr.type) {
      case "String":
      case "Number":
      case "Boolean": {
        yield { value: expr.value, path: LITERAL_PATH };
        return;
      }
      case "Null": {
        yield { value: null, path: LITERAL_PATH };
        return;
      }
      case "Path": {
        yield* evaluatePath({ expr, value, path });
        return;
      }
      default:
        return;
    }
}
function* evaluatePath({
  expr,
  value,
  path
}) {
  if (!expr) {
    yield { value, path };
    return;
  }
  for (const candidate of evaluatePath({ expr: expr.base, value, path })) {
    if (expr.recursive) {
      yield* evaluateRecursivePath({ segment: expr.segment, ...candidate });
      continue;
    }
    yield* evaluateSegment({ segment: expr.segment, ...candidate });
  }
}
function* evaluateRecursivePath({
  segment,
  value,
  path
}) {
  if (yield* evaluateSegment({ segment, value, path }), Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      const item = value[index];
      yield* evaluateRecursivePath({ segment, ...itemEntry(item, path, index) });
    }
    return;
  }
  if (isRecord(value)) {
    for (const [key, nestedValue] of Object.entries(value))
      yield* evaluateRecursivePath({ segment, value: nestedValue, path: [...path, key] });
    return;
  }
}
function* evaluateSegment({
  segment,
  value,
  path
}) {
  switch (segment.type) {
    case "This": {
      yield { value, path };
      return;
    }
    case "Identifier": {
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
          const item = value[index];
          yield* evaluateSegment({ segment, ...itemEntry(item, path, index) });
        }
        return;
      }
      yield {
        value: isRecord(value) ? value[segment.name] : void 0,
        path: [...path, segment.name]
      };
      return;
    }
    case "Subscript": {
      yield* evaluateSubscript({ subscript: segment, value, path });
      return;
    }
    case "Wildcard": {
      if (Array.isArray(value)) {
        for (let index = 0; index < value.length; index++) {
          const item = value[index];
          yield itemEntry(item, path, index);
        }
        return;
      }
      if (isRecord(value)) {
        for (const [key, nestedValue] of Object.entries(value))
          yield { value: nestedValue, path: [...path, key] };
        return;
      }
      return;
    }
    default:
      return;
  }
}
function* evaluateSubscript({
  value,
  subscript,
  path
}) {
  for (const element of subscript.elements)
    switch (element.type) {
      case "Existence": {
        yield* evaluateExistence({ existence: element, value, path });
        continue;
      }
      case "Comparison": {
        yield* evaluateComparison({ comparison: element, value, path });
        continue;
      }
      case "Path": {
        yield* evaluatePath({ expr: element, value, path });
        continue;
      }
      case "Slice": {
        if (!Array.isArray(value)) continue;
        let start = element.start ?? 0, end = element.end ?? value.length;
        start < 0 && (start = value.length + start), end < 0 && (end = value.length + end), start = Math.max(0, Math.min(start, value.length)), end = Math.max(0, Math.min(end, value.length));
        for (let index = start; index < end; index++) {
          const item = value[index];
          yield itemEntry(item, path, index);
        }
        continue;
      }
      // handle number nodes in subscripts as array indices
      case "Number": {
        const item = Array.isArray(value) ? value.at(element.value) : void 0;
        yield itemEntry(item, path, element.value);
        continue;
      }
      // strings and booleans are always evaluated as literals
      case "String":
      case "Boolean": {
        yield* evaluateExpression({ expr: element, value, path });
        continue;
      }
      default:
        continue;
    }
}
function* evaluateExistence({
  existence,
  value,
  path
}) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index++) {
      const item = value[index];
      yield* evaluateExistence({ existence, ...itemEntry(item, path, index) });
    }
    return;
  }
  for (const candidate of evaluatePath({ expr: existence.base, path, value }))
    if (typeof candidate.value < "u") {
      yield { value, path };
      return;
    }
}
function getKeyFromComparison({ operator, left, right }) {
  if (operator !== "==") return;
  const keyPathNode = [left, right].find(isKeyPath);
  if (!keyPathNode) return;
  const other = left === keyPathNode ? right : left;
  if (other.type === "String")
    return other.value;
}
const isKeyPath = (node) => node.type !== "Path" || node.base || node.recursive || node.segment.type !== "Identifier" ? !1 : node.segment.name === "_key";
function* removeUndefinedMatches(values) {
  for (const item of values)
    typeof item.value < "u" && (yield item);
}
function* evaluateComparison({
  comparison,
  value,
  path
}) {
  if (Array.isArray(value)) {
    const _key = getKeyFromComparison(comparison);
    if (_key) {
      const index = getIndexForKey(value, _key);
      yield {
        value: typeof index == "number" ? value[index] : void 0,
        path: [...path, { _key }]
      };
      return;
    }
    for (let index = 0; index < value.length; index++) {
      const item = value[index];
      yield* evaluateComparison({ comparison, ...itemEntry(item, path, index) });
    }
    return;
  }
  const leftResult = removeUndefinedMatches(
    evaluateExpression({ expr: comparison.left, value, path })
  ).next(), rightResult = removeUndefinedMatches(
    evaluateExpression({ expr: comparison.right, value, path })
  ).next();
  if (leftResult.done || rightResult.done) return;
  const { value: left } = leftResult.value, { value: right } = rightResult.value;
  if (comparison.operator === "==") {
    left === right && (yield { value, path });
    return;
  }
  if (comparison.operator === "!=") {
    left !== right && (yield { value, path });
    return;
  }
  typeof left != "number" || typeof right != "number" || (comparison.operator === "<" && left < right && (yield { value, path }), comparison.operator === "<=" && left <= right && (yield { value, path }), comparison.operator === ">" && left > right && (yield { value, path }), comparison.operator === ">=" && left >= right && (yield { value, path }));
}
export {
  getIndexForKey,
  getPathDepth,
  joinPaths,
  jsonMatch,
  parsePath,
  slicePath,
  stringifyPath
};
//# sourceMappingURL=index.js.map

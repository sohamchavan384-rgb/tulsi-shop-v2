function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function pathRegExp(pattern) {
  const re = [];
  for (const part of pattern.split("."))
    part === "*" ? re.push("[^.]+") : part === "**" ? re.push(".*") : re.push(escapeRegExp(part));
  return new RegExp(`^${re.join(".")}$`);
}
class Path {
  pattern;
  patternRe;
  constructor(pattern) {
    this.pattern = pattern, this.patternRe = pathRegExp(pattern);
  }
  matches(str) {
    return this.patternRe.test(str);
  }
  toJSON() {
    return this.pattern;
  }
}
const RFC3339_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([-+]\d{2}:\d{2}))$/;
function parseRFC3339(str) {
  return RFC3339_REGEX.test(str) ? new Date(str) : null;
}
function formatRFC3339(d) {
  const year = addLeadingZero(d.getUTCFullYear(), 4), month = addLeadingZero(d.getUTCMonth() + 1, 2), day = addLeadingZero(d.getUTCDate(), 2), hour = addLeadingZero(d.getUTCHours(), 2), minute = addLeadingZero(d.getUTCMinutes(), 2), second = addLeadingZero(d.getUTCSeconds(), 2);
  let fractionalSecond = "";
  const millis = d.getMilliseconds();
  return millis != 0 && (fractionalSecond = `.${addLeadingZero(millis, 3)}`), `${year}-${month}-${day}T${hour}:${minute}:${second}${fractionalSecond}Z`;
}
function addLeadingZero(num, targetLength) {
  let str = num.toString();
  for (; str.length < targetLength; )
    str = `0${str}`;
  return str;
}
class StaticValue {
  data;
  type;
  constructor(data, type) {
    this.data = data, this.type = type;
  }
  isArray() {
    return this.type === "array";
  }
  // eslint-disable-next-line require-await
  async get() {
    return this.data;
  }
  asStatic() {
    return this;
  }
  [Symbol.asyncIterator]() {
    if (Array.isArray(this.data))
      return (function* (data) {
        for (const element of data)
          yield fromJS(element);
      })(this.data);
    throw new Error(`Cannot iterate over: ${this.type}`);
  }
}
const NULL_VALUE = new StaticValue(null, "null"), TRUE_VALUE = new StaticValue(!0, "boolean"), FALSE_VALUE = new StaticValue(!1, "boolean");
class DateTime {
  date;
  constructor(date) {
    this.date = date;
  }
  static parseToValue(str) {
    const date = parseRFC3339(str);
    return date ? new StaticValue(new DateTime(date), "datetime") : NULL_VALUE;
  }
  equals(other) {
    return this.date.getTime() == other.date.getTime();
  }
  add(secs) {
    const copy = new Date(this.date.getTime());
    return copy.setTime(copy.getTime() + secs * 1e3), new DateTime(copy);
  }
  difference(other) {
    return (this.date.getTime() - other.date.getTime()) / 1e3;
  }
  compareTo(other) {
    return this.date.getTime() - other.date.getTime();
  }
  toString() {
    return formatRFC3339(this.date);
  }
  toJSON() {
    return this.toString();
  }
}
function fromNumber(num) {
  return Number.isFinite(num) ? new StaticValue(num, "number") : NULL_VALUE;
}
function fromString(str) {
  return new StaticValue(str, "string");
}
function fromDateTime(dt) {
  return new StaticValue(dt, "datetime");
}
function fromPath(path) {
  return new StaticValue(path, "path");
}
function isIterator(obj) {
  return obj && typeof obj.next == "function";
}
function fromArray(val) {
  return new StaticValue(val, "array");
}
function fromJS(val) {
  return isIterator(val) ? new StreamValue(async function* () {
    for await (const value of val)
      yield fromJS(value);
  }) : val == null ? NULL_VALUE : new StaticValue(val, getType(val));
}
function toJS(val) {
  const normalized = maybeNormalize(val.data);
  return normalized === void 0 ? val.data : normalized;
}
function maybeNormalize(data) {
  if (!(data === null || typeof data > "u")) {
    if (Array.isArray(data)) {
      let result;
      for (let i = 0; i < data.length; i++) {
        let normalized = maybeNormalize(data[i]);
        normalized !== void 0 && result === void 0 && (result = data.slice(0, i)), result !== void 0 && (normalized === void 0 && (normalized = data[i]), result.push(normalized));
      }
      return result;
    }
    if (typeof data == "object") {
      if ("toJSON" in data && typeof data.toJSON == "function")
        return data.toJSON();
      const entries = Object.entries(data);
      let result;
      for (let i = 0; i < entries.length; i++) {
        const [key, value] = entries[i];
        let normalized = maybeNormalize(value);
        normalized !== void 0 && result === void 0 && (result = Object.fromEntries(entries.slice(0, i))), result !== void 0 && (normalized === void 0 && (normalized = value), result[key] = normalized);
      }
      return result;
    }
  }
}
function getType(data) {
  return data === null || typeof data > "u" ? "null" : Array.isArray(data) ? "array" : data instanceof Path ? "path" : data instanceof DateTime ? "datetime" : typeof data;
}
class StreamValue {
  type = "stream";
  generator;
  ticker;
  isDone;
  data;
  constructor(generator) {
    this.generator = generator, this.ticker = null, this.isDone = !1, this.data = [];
  }
  // eslint-disable-next-line class-methods-use-this
  isArray() {
    return !0;
  }
  async get() {
    const result = [];
    for await (const value of this)
      result.push(await value.get());
    return result;
  }
  async asStatic() {
    return new StaticValue(await this.get(), "array");
  }
  async *[Symbol.asyncIterator]() {
    let i = 0;
    for (; ; ) {
      for (; i < this.data.length; i++)
        yield this.data[i];
      if (this.isDone)
        return;
      await this._nextTick();
    }
  }
  _nextTick() {
    if (this.ticker)
      return this.ticker;
    let currentResolver, currentRejector;
    const setupTicker = () => {
      this.ticker = new Promise((resolve, reject) => {
        currentResolver = resolve, currentRejector = reject;
      });
    }, tick = () => {
      currentResolver(), setupTicker();
    }, fetch = async () => {
      try {
        for await (const value of this.generator())
          this.data.push(value), tick();
        this.isDone = !0, tick();
      } catch (error) {
        currentRejector(error);
      }
    };
    return setupTicker(), fetch(), this.ticker;
  }
}
function isSelectorNode(node) {
  return [
    "AccessAttribute",
    "SelectorFuncCall",
    "Group",
    "Tuple",
    "ArrayCoerce",
    "Filter",
    "SelectorNested"
  ].includes(node.type);
}
function isSelectorNested(node) {
  return ["AccessAttribute", "ArrayCoerce", "Filter", "Group", "Tuple", "SelectorNested"].includes(
    node.type
  );
}
const CHARS = /([^!@#$%^&*(),\\/?";:{}|[\]+<>\s-])+/g, CHARS_WITH_WILDCARD = /([^!@#$%^&(),\\/?";:{}|[\]+<>\s-])+/g, EDGE_CHARS = /(\b\.+|\.+\b)/g;
function matchText(tokens, patterns) {
  return tokens.length === 0 || patterns.length === 0 ? !1 : patterns.every((pattern) => pattern(tokens));
}
function matchTokenize(text) {
  return text.replace(EDGE_CHARS, "").match(CHARS) || [];
}
function matchAnalyzePattern(text) {
  return matchPatternRegex(text).map((re) => (tokens) => tokens.some((token) => re.test(token)));
}
function matchPatternRegex(text) {
  return (text.replace(EDGE_CHARS, "").match(CHARS_WITH_WILDCARD) || []).map(
    (term) => new RegExp(`^${term.slice(0, 1024).replace(/\*/g, ".*")}$`, "i")
  );
}
function gatherText(value, flatMap) {
  if (value.type === "string")
    return { parts: flatMap(value.data), success: !0 };
  if (value.type === "array") {
    let success = !0;
    const parts = [];
    for (const part of value.data)
      typeof part == "string" ? parts.push(...flatMap(part)) : success = !1;
    return { parts, success };
  }
  return value.type === "stream" ? (async () => {
    let success = !0;
    const parts = [];
    for await (const part of value)
      part.type === "string" ? parts.push(...flatMap(part.data)) : success = !1;
    return { parts, success };
  })() : { parts: [], success: !1 };
}
function canConstantEvaluate(node) {
  switch (node.type) {
    case "Group":
      return canConstantEvaluate(node.base);
    case "Value":
    case "Parameter":
      return !0;
    case "Pos":
    case "Neg":
      return canConstantEvaluate(node.base);
    case "OpCall":
      switch (node.op) {
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
        case "**":
          return canConstantEvaluate(node.left) && canConstantEvaluate(node.right);
        default:
          return !1;
      }
    default:
      return !1;
  }
}
function tryConstantEvaluate(node) {
  return canConstantEvaluate(node) ? constantEvaluate(node) : null;
}
function isRecord(val) {
  return val.constructor === Object || val.constructor === void 0;
}
function staticFromJS(val) {
  return val == null ? NULL_VALUE : typeof val == "boolean" ? val ? TRUE_VALUE : FALSE_VALUE : typeof val == "number" ? fromNumber(val) : typeof val == "string" ? fromString(val) : Array.isArray(val) ? fromArray(val) : typeof val == "object" && isRecord(val) ? new StaticValue(val, "object") : NULL_VALUE;
}
function constantEvaluate(node) {
  switch (node.type) {
    case "Value":
      return staticFromJS(node.value);
    case "Parameter":
      return NULL_VALUE;
    case "Group":
      return constantEvaluate(node.base);
    case "Pos": {
      const base = constantEvaluate(node.base);
      return base.type !== "number" ? NULL_VALUE : fromNumber(base.data);
    }
    case "Neg": {
      const base = constantEvaluate(node.base);
      return base.type !== "number" ? NULL_VALUE : fromNumber(-base.data);
    }
    case "OpCall": {
      const left = constantEvaluate(node.left), right = constantEvaluate(node.right);
      switch (node.op) {
        case "+":
          return left.type === "number" && right.type === "number" ? fromNumber(left.data + right.data) : left.type === "string" && right.type === "string" ? fromString(left.data + right.data) : left.type === "array" && right.type === "array" ? fromArray(left.data.concat(right.data)) : left.type === "object" && right.type === "object" ? new StaticValue({ ...left.data, ...right.data }, "object") : NULL_VALUE;
        case "-":
          return left.type === "number" && right.type === "number" ? fromNumber(left.data - right.data) : NULL_VALUE;
        case "*":
          return left.type === "number" && right.type === "number" ? fromNumber(left.data * right.data) : NULL_VALUE;
        case "/":
          return left.type === "number" && right.type === "number" ? fromNumber(left.data / right.data) : NULL_VALUE;
        case "%":
          return left.type === "number" && right.type === "number" ? fromNumber(left.data % right.data) : NULL_VALUE;
        case "**":
          return left.type === "number" && right.type === "number" ? fromNumber(Math.pow(left.data, right.data)) : NULL_VALUE;
        default:
          return NULL_VALUE;
      }
    }
    default:
      return NULL_VALUE;
  }
}
const namespaceRegistry = {
  global: {
    anywhere: { arity: 1 },
    coalesce: {},
    count: { arity: 1 },
    dateTime: { arity: 1 },
    defined: { arity: 1 },
    identity: { arity: 0 },
    length: { arity: 1 },
    path: { arity: 1 },
    string: { arity: 1 },
    references: { arity: (c) => c >= 1 },
    round: { arity: (count) => count >= 1 && count <= 2 },
    now: { arity: 0 },
    boost: { arity: 2 },
    lower: { arity: 1 },
    upper: { arity: 1 }
  },
  string: {
    lower: { arity: 1 },
    upper: { arity: 1 },
    split: { arity: 2 },
    startsWith: { arity: 2 }
  },
  array: {
    join: { arity: 2 },
    compact: { arity: 1 },
    unique: { arity: 1 },
    intersects: { arity: 2 }
  },
  pt: {
    text: { arity: 1 }
  },
  delta: {
    operation: {},
    changedAny: { arity: 1, mode: "delta" },
    changedOnly: { arity: 1, mode: "delta" }
  },
  diff: {
    changedAny: { arity: 3 },
    changedOnly: { arity: 3 }
  },
  media: {
    aspect: { arity: 2 }
  },
  sanity: {
    projectId: {},
    dataset: {},
    versionOf: { arity: 1 },
    partOfRelease: { arity: 1 }
  },
  math: {
    min: { arity: 1 },
    max: { arity: 1 },
    sum: { arity: 1 },
    avg: { arity: 1 }
  },
  dateTime: {
    now: { arity: 0 }
  },
  releases: {
    all: { arity: 0 }
  },
  text: {
    query: { arity: 1 },
    semanticSimilarity: { arity: 1 }
  },
  geo: {
    latLng: {},
    contains: {},
    intersects: {},
    distance: {}
  },
  documents: {
    get: {},
    incomingRefCount: {},
    incomingGlobalDocumentReferenceCount: {}
  },
  user: {
    attributes: {}
  }
}, pipeFunctionRegistry = {
  order: { arity: (count) => count >= 1 },
  score: { arity: (count) => count >= 1 }
};
export {
  DateTime,
  FALSE_VALUE,
  NULL_VALUE,
  Path,
  StreamValue,
  TRUE_VALUE,
  fromArray,
  fromDateTime,
  fromJS,
  fromNumber,
  fromPath,
  fromString,
  gatherText,
  getType,
  isSelectorNested,
  isSelectorNode,
  matchAnalyzePattern,
  matchPatternRegex,
  matchText,
  matchTokenize,
  namespaceRegistry,
  pipeFunctionRegistry,
  toJS,
  tryConstantEvaluate
};
//# sourceMappingURL=shared.mjs.map

"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 });
var evaluator = require("./_chunks-cjs/evaluator.js"), shared = require("./_chunks-cjs/shared.js"), experimental = require("./experimental.js"), debug = require("debug");
function _interopDefaultCompat(e) {
  return e && typeof e == "object" && "default" in e ? e : { default: e };
}
var debug__default = /* @__PURE__ */ _interopDefaultCompat(debug);
class MarkProcessor {
  _string;
  marks;
  index;
  customFunctions;
  parseOptions;
  allowBoost = !1;
  constructor(string, marks, customFunctions, parseOptions) {
    this._string = string, this.marks = marks, this.customFunctions = customFunctions, this.index = 0, this.parseOptions = parseOptions;
  }
  hasMark(pos = 0) {
    return this.index + pos < this.marks.length;
  }
  getMark(pos = 0) {
    return this.marks[this.index + pos];
  }
  shift() {
    this.index += 1;
  }
  process(visitor) {
    const mark = this.marks[this.index];
    this.shift();
    const func = visitor[mark.name];
    if (!func)
      throw new Error(`Unknown handler: ${mark.name}`);
    return func.call(visitor, this, mark);
  }
  processString() {
    return this.shift(), this.processStringEnd();
  }
  processStringEnd() {
    const prev = this.marks[this.index - 1], curr = this.marks[this.index];
    return this.shift(), this.string.slice(prev.position, curr.position);
  }
  slice(len) {
    const pos = this.marks[this.index].position;
    return this.string.slice(pos, pos + len);
  }
  get string() {
    return this._string;
  }
}
const WS = /^([\t\n\v\f\r \u0085\u00A0]|(\/\/[^\n]*\n))+/, NUM = /^\d+/, IDENT = /^[a-zA-Z_][a-zA-Z_0-9]*/;
function parse$1(str) {
  let pos = 0;
  pos = skipWS(str, pos);
  let customFunctions = {};
  for (; pos < str.length && str.substring(pos, pos + 2) === "fn"; ) {
    let funcResult = parseFunctionDeclaration(str, pos);
    if (funcResult.type === "error") return funcResult;
    customFunctions[`${funcResult.namespace}::${funcResult.name}`] = funcResult, pos = skipWS(str, funcResult.position);
  }
  let result = parseExpr(str, pos, 0);
  return result.type === "error" ? result : (pos = skipWS(str, result.position), pos !== str.length ? (result.failPosition && (pos = result.failPosition - 1), { type: "error", message: "Unexpected end of query", position: pos }) : (delete result.position, delete result.failPosition, result.customFunctions = customFunctions, result));
}
function parseExpr(str, pos, level) {
  let startPos = pos, token = str[pos], marks;
  switch (token) {
    case "+": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 10);
      if (rhs.type === "error") return rhs;
      marks = [{ name: "pos", position: startPos }].concat(rhs.marks), pos = rhs.position;
      break;
    }
    case "-": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 8);
      if (rhs.type === "error") return rhs;
      marks = [{ name: "neg", position: startPos }].concat(rhs.marks), pos = rhs.position;
      break;
    }
    case "(": {
      let result = parseGroupOrTuple(str, pos);
      if (result.type === "error") return result;
      pos = result.position, marks = result.marks;
      break;
    }
    case "!": {
      let rhs = parseExpr(str, skipWS(str, pos + 1), 10);
      if (rhs.type === "error") return rhs;
      marks = [{ name: "not", position: startPos }].concat(rhs.marks), pos = rhs.position;
      break;
    }
    case "{": {
      let result = parseObject(str, pos);
      if (result.type === "error") return result;
      marks = result.marks, pos = result.position;
      break;
    }
    case "[":
      if (marks = [{ name: "array", position: pos }], pos = skipWS(str, pos + 1), str[pos] !== "]")
        for (; ; ) {
          str.slice(pos, pos + 3) === "..." && (marks.push({ name: "array_splat", position: pos }), pos = skipWS(str, pos + 3));
          let res = parseExpr(str, pos, 0);
          if (res.type === "error") return res;
          if (marks = marks.concat(res.marks), pos = res.position, pos = skipWS(str, pos), str[pos] !== "," || (pos = skipWS(str, pos + 1), str[pos] === "]")) break;
        }
      if (str[pos] === "]")
        pos++, marks.push({ name: "array_end", position: pos });
      else
        return { type: "error", message: 'Expected "]" after array expression', position: pos };
      break;
    case "'":
    case '"': {
      let result = parseString(str, pos);
      if (result.type === "error") return result;
      marks = result.marks, pos = result.position;
      break;
    }
    case "^": {
      for (pos++, marks = []; str[pos] === "." && str[pos + 1] === "^"; )
        marks.push({ name: "dblparent", position: startPos }), pos += 2;
      marks.push({ name: "parent", position: startPos });
      break;
    }
    case "@":
      marks = [{ name: "this", position: startPos }], pos++;
      break;
    case "*":
      marks = [{ name: "everything", position: startPos }], pos++;
      break;
    case "$": {
      let identLen = parseRegex(str, pos + 1, IDENT);
      identLen && (pos += 1 + identLen, marks = [
        { name: "param", position: startPos },
        { name: "ident", position: startPos + 1 },
        { name: "ident_end", position: pos }
      ]);
      break;
    }
    default: {
      let numLen = parseRegex(str, pos, NUM);
      if (numLen) {
        pos += numLen;
        let name = "integer";
        if (str[pos] === ".") {
          let fracLen = parseRegex(str, pos + 1, NUM);
          fracLen && (name = "float", pos += 1 + fracLen);
        }
        if (str[pos] === "e" || str[pos] === "E") {
          name = "sci", pos++, (str[pos] === "+" || str[pos] === "-") && pos++;
          let expLen = parseRegex(str, pos, NUM);
          if (!expLen) return { type: "error", message: "Exponent must be a number", position: pos };
          pos += expLen;
        }
        marks = [
          { name, position: startPos },
          { name: name + "_end", position: pos }
        ];
        break;
      }
      let identLen = parseRegex(str, pos, IDENT);
      if (identLen) {
        switch (pos += identLen, str[pos]) {
          case ":":
          case "(": {
            let result = parseFuncCall(str, startPos, pos);
            if (result.type === "error") return result;
            marks = result.marks, pos = result.position;
            break;
          }
          default:
            marks = [
              { name: "this_attr", position: startPos },
              { name: "ident", position: startPos },
              { name: "ident_end", position: pos }
            ];
        }
        break;
      }
    }
  }
  if (!marks)
    return { type: "error", message: "Expected expression", position: pos };
  let lhsLevel = 12, trav;
  loop: for (; ; ) {
    let innerPos = skipWS(str, pos);
    if (innerPos === str.length) {
      pos = innerPos;
      break;
    }
    if (trav = parseTraversal(str, innerPos), trav.type === "success") {
      for (marks.unshift({ name: "traverse", position: startPos }); trav.type === "success"; )
        marks = marks.concat(trav.marks), pos = trav.position, trav = parseTraversal(str, skipWS(str, pos));
      marks.push({ name: "traversal_end", position: pos });
      continue;
    }
    switch (str[innerPos]) {
      case "=": {
        switch (str[innerPos + 1]) {
          case ">": {
            if (level > 1 || lhsLevel <= 1) break loop;
            let rhs = parseExpr(str, skipWS(str, innerPos + 2), 1);
            if (rhs.type === "error") return rhs;
            marks = marks.concat(rhs.marks), marks.unshift({ name: "pair", position: startPos }), pos = rhs.position, lhsLevel = 1;
            break;
          }
          case "=": {
            if (level > 4 || lhsLevel <= 4) break loop;
            let rhs = parseExpr(str, skipWS(str, innerPos + 2), 5);
            if (rhs.type === "error") return rhs;
            marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 2 }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
            break;
          }
          default:
            break loop;
        }
        break;
      }
      case "+": {
        if (level > 6 || lhsLevel < 6) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 1), 7);
        if (rhs.type === "error") return rhs;
        marks = marks.concat(rhs.marks), marks.unshift({ name: "add", position: startPos }), pos = rhs.position, lhsLevel = 6;
        break;
      }
      case "-": {
        if (level > 6 || lhsLevel < 6) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 1), 7);
        if (rhs.type === "error") return rhs;
        marks = marks.concat(rhs.marks), marks.unshift({ name: "sub", position: startPos }), pos = rhs.position, lhsLevel = 6;
        break;
      }
      case "*": {
        if (str[innerPos + 1] === "*") {
          if (level > 8 || lhsLevel <= 8) break loop;
          let rhs2 = parseExpr(str, skipWS(str, innerPos + 2), 8);
          if (rhs2.type === "error") return rhs2;
          marks = marks.concat(rhs2.marks), marks.unshift({ name: "pow", position: startPos }), pos = rhs2.position, lhsLevel = 8;
          break;
        }
        if (level > 7 || lhsLevel < 7) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 1), 8);
        if (rhs.type === "error") return rhs;
        marks = marks.concat(rhs.marks), marks.unshift({ name: "mul", position: startPos }), pos = rhs.position, lhsLevel = 7;
        break;
      }
      case "/": {
        if (level > 7 || lhsLevel < 7) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 1), 8);
        if (rhs.type === "error") return rhs;
        marks = marks.concat(rhs.marks), marks.unshift({ name: "div", position: startPos }), pos = rhs.position, lhsLevel = 7;
        break;
      }
      case "%": {
        if (level > 7 || lhsLevel < 7) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 1), 8);
        if (rhs.type === "error") return rhs;
        marks = marks.concat(rhs.marks), marks.unshift({ name: "mod", position: startPos }), pos = rhs.position, lhsLevel = 7;
        break;
      }
      case "<":
      case ">": {
        if (level > 4 || lhsLevel <= 4) break loop;
        let nextPos = innerPos + 1;
        str[nextPos] === "=" && nextPos++;
        let rhs = parseExpr(str, skipWS(str, nextPos), 5);
        if (rhs.type === "error") return rhs;
        marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: nextPos }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
        break;
      }
      case "|": {
        if (str[innerPos + 1] === "|") {
          if (level > 2 || lhsLevel < 2) break loop;
          let rhs = parseExpr(str, skipWS(str, innerPos + 2), 3);
          if (rhs.type === "error") return rhs;
          marks = marks.concat(rhs.marks), marks.unshift({ name: "or", position: startPos }), pos = rhs.position, lhsLevel = 2;
        } else {
          if (level > 11 || lhsLevel < 11) break loop;
          let identPos = skipWS(str, innerPos + 1), identLen = parseRegex(str, identPos, IDENT);
          if (!identLen) return { type: "error", message: "Expected identifier", position: identPos };
          if (pos = identPos + identLen, str[pos] === "(" || str[pos] === ":") {
            let result = parseFuncCall(str, identPos, pos);
            if (result.type === "error") return result;
            marks = marks.concat(result.marks), marks.unshift({ name: "pipecall", position: startPos }), pos = result.position, lhsLevel = 11;
          }
        }
        break;
      }
      case "&": {
        if (str[innerPos + 1] != "&" || level > 3 || lhsLevel < 3) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 2), 4);
        if (rhs.type === "error") return rhs;
        marks = marks.concat(rhs.marks), marks.unshift({ name: "and", position: startPos }), pos = rhs.position, lhsLevel = 3;
        break;
      }
      case "!": {
        if (str[innerPos + 1] !== "=" || level > 4 || lhsLevel <= 4) break loop;
        let rhs = parseExpr(str, skipWS(str, innerPos + 2), 5);
        if (rhs.type === "error") return rhs;
        marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 2 }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
        break;
      }
      case "d": {
        if (str.slice(innerPos, innerPos + 4) !== "desc" || level > 4 || lhsLevel < 4) break loop;
        marks.unshift({ name: "desc", position: startPos }), pos = innerPos + 4, lhsLevel = 4;
        break;
      }
      case "a": {
        if (str.slice(innerPos, innerPos + 3) !== "asc" || level > 4 || lhsLevel < 4) break loop;
        marks.unshift({ name: "asc", position: startPos }), pos = innerPos + 3, lhsLevel = 4;
        break;
      }
      default:
        switch (parseRegexStr(str, innerPos, IDENT)) {
          case "in": {
            if (level > 4 || lhsLevel <= 4) break loop;
            pos = skipWS(str, innerPos + 2);
            let isGroup = !1;
            str[pos] === "(" && (isGroup = !0, pos = skipWS(str, pos + 1));
            let rangePos = pos, result = parseExpr(str, pos, 5);
            if (result.type === "error") return result;
            if (pos = skipWS(str, result.position), str[pos] === "." && str[pos + 1] === ".") {
              let type = "inc_range";
              str[pos + 2] === "." ? (type = "exc_range", pos = skipWS(str, pos + 3)) : pos = skipWS(str, pos + 2);
              let rhs = parseExpr(str, pos, 5);
              if (rhs.type === "error") return rhs;
              marks.unshift({ name: "in_range", position: startPos }), marks = marks.concat({ name: type, position: rangePos }, result.marks, rhs.marks), pos = rhs.position;
            } else
              marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 2 }), marks = marks.concat(result.marks);
            if (isGroup) {
              if (pos = skipWS(str, pos), str[pos] !== ")")
                return { type: "error", message: 'Expected ")" in group', position: pos };
              pos++;
            }
            lhsLevel = 4;
            break;
          }
          case "match": {
            if (level > 4 || lhsLevel <= 4) break loop;
            let rhs = parseExpr(str, skipWS(str, innerPos + 5), 5);
            if (rhs.type === "error") return rhs;
            marks.unshift({ name: "comp", position: startPos }), marks.push({ name: "op", position: innerPos }, { name: "op_end", position: innerPos + 5 }), marks = marks.concat(rhs.marks), pos = rhs.position, lhsLevel = 4;
            break;
          }
          default:
            break loop;
        }
    }
  }
  let failPosition = trav?.type === "error" && trav.position;
  return { type: "success", marks, position: pos, failPosition };
}
function parseGroupOrTuple(str, pos) {
  const startPos = pos;
  let marks, rhs = parseExpr(str, skipWS(str, pos + 1), 0);
  if (rhs.type === "error") return rhs;
  switch (pos = skipWS(str, rhs.position), str[pos]) {
    case ",": {
      for (marks = [{ name: "tuple", position: startPos }].concat(rhs.marks), pos = skipWS(str, pos + 1); ; ) {
        if (rhs = parseExpr(str, pos, 0), rhs.type === "error") return rhs;
        if (marks.push(...rhs.marks), pos = skipWS(str, rhs.position), str[pos] !== ",") break;
        pos = skipWS(str, pos + 1);
      }
      if (str[pos] !== ")")
        return { type: "error", message: 'Expected ")" after tuple expression', position: pos };
      pos++, marks.push({ name: "tuple_end", position: pos });
      break;
    }
    case ")": {
      pos++, marks = [{ name: "group", position: startPos }].concat(rhs.marks);
      break;
    }
    default:
      return { type: "error", message: `Unexpected character "${str[pos]}"`, position: pos };
  }
  return { type: "success", marks, position: pos };
}
function parseTraversal(str, pos) {
  let startPos = pos;
  switch (str[pos]) {
    case ".": {
      if (pos = skipWS(str, pos + 1), str[pos] === "(")
        return parseGroupOrTuple(str, pos);
      let identStart = pos, identLen2 = parseRegex(str, pos, IDENT);
      return identLen2 ? (pos += identLen2, {
        type: "success",
        marks: [
          { name: "attr_access", position: startPos },
          { name: "ident", position: identStart },
          { name: "ident_end", position: pos }
        ],
        position: pos
      }) : { type: "error", message: 'Expected identifier after "."', position: pos };
    }
    case "-":
      if (str[pos + 1] !== ">")
        return { type: "error", message: 'Expected ">" in reference', position: pos };
      let marks = [{ name: "deref", position: startPos }];
      pos += 2;
      let identPos = skipWS(str, pos), identLen = parseRegex(str, identPos, IDENT);
      return identLen && (pos = identPos + identLen, marks.push(
        { name: "deref_attr", position: identPos },
        { name: "ident", position: identPos },
        { name: "ident_end", position: pos }
      )), {
        type: "success",
        marks,
        position: pos
      };
    case "[": {
      if (pos = skipWS(str, pos + 1), str[pos] === "]")
        return {
          type: "success",
          marks: [{ name: "array_postfix", position: startPos }],
          position: pos + 1
        };
      let rangePos = pos, result = parseExpr(str, pos, 0);
      if (result.type === "error") return result;
      if (pos = skipWS(str, result.position), str[pos] === "." && str[pos + 1] === ".") {
        let type = "inc_range";
        str[pos + 2] === "." ? (type = "exc_range", pos += 3) : pos += 2, pos = skipWS(str, pos);
        let rhs = parseExpr(str, pos, 0);
        return rhs.type === "error" ? rhs : (pos = skipWS(str, rhs.position), str[pos] !== "]" ? { type: "error", message: 'Expected "]" after array expression', position: pos } : {
          type: "success",
          marks: [
            { name: "slice", position: startPos },
            { name: type, position: rangePos }
          ].concat(result.marks, rhs.marks),
          position: pos + 1
        });
      }
      return str[pos] !== "]" ? { type: "error", message: 'Expected "]" after array expression', position: pos } : {
        type: "success",
        marks: [{ name: "square_bracket", position: startPos }].concat(result.marks),
        position: pos + 1
      };
    }
    case "|": {
      if (pos = skipWS(str, pos + 1), str[pos] === "{") {
        let result = parseObject(str, pos);
        return result.type === "error" || result.marks.unshift({ name: "projection", position: startPos }), result;
      }
      break;
    }
    case "{": {
      let result = parseObject(str, pos);
      return result.type === "error" || result.marks.unshift({ name: "projection", position: startPos }), result;
    }
  }
  return { type: "error", message: "Unexpected character in traversal", position: pos };
}
function parseFuncCall(str, startPos, pos) {
  let marks = [];
  if (marks.push({ name: "func_call", position: startPos }), str[pos] === ":" && str[pos + 1] === ":") {
    marks.push({ name: "namespace", position: startPos }), marks.push({ name: "ident", position: startPos }, { name: "ident_end", position: pos }), pos = skipWS(str, pos + 2);
    let nameLen = parseRegex(str, pos, IDENT);
    if (!nameLen) return { type: "error", message: "Expected function name", position: pos };
    if (marks.push({ name: "ident", position: pos }, { name: "ident_end", position: pos + nameLen }), pos = skipWS(str, pos + nameLen), str[pos] !== "(")
      return { type: "error", message: 'Expected "(" after function name', position: pos };
    pos++, pos = skipWS(str, pos);
  } else
    marks.push({ name: "ident", position: startPos }, { name: "ident_end", position: pos }), pos = skipWS(str, pos + 1);
  let lastPos = pos;
  if (str[pos] !== ")")
    for (; ; ) {
      let result = parseExpr(str, pos, 0);
      if (result.type === "error") return result;
      if (marks = marks.concat(result.marks), lastPos = result.position, pos = skipWS(str, result.position), str[pos] !== "," || (pos = skipWS(str, pos + 1), str[pos] === ")")) break;
    }
  return str[pos] !== ")" ? { type: "error", message: 'Expected ")" after function arguments', position: pos } : (marks.push({ name: "func_args_end", position: lastPos }), {
    type: "success",
    marks,
    position: pos + 1
  });
}
function parseObject(str, pos) {
  let marks = [{ name: "object", position: pos }];
  for (pos = skipWS(str, pos + 1); str[pos] !== "}"; ) {
    let pairPos = pos;
    if (str.slice(pos, pos + 3) === "...")
      if (pos = skipWS(str, pos + 3), str[pos] !== "}" && str[pos] !== ",") {
        let expr = parseExpr(str, pos, 0);
        if (expr.type === "error") return expr;
        marks.push({ name: "object_splat", position: pairPos }), marks = marks.concat(expr.marks), pos = expr.position;
      } else
        marks.push({ name: "object_splat_this", position: pairPos });
    else {
      let expr = parseExpr(str, pos, 0);
      if (expr.type === "error") return expr;
      let nextPos = skipWS(str, expr.position);
      if (expr.marks[0].name === "str" && str[nextPos] === ":") {
        let value = parseExpr(str, skipWS(str, nextPos + 1), 0);
        if (value.type === "error") return value;
        marks.push({ name: "object_pair", position: pairPos }), marks = marks.concat(expr.marks, value.marks), pos = value.position;
      } else
        marks = marks.concat({ name: "object_expr", position: pos }, expr.marks), pos = expr.position;
    }
    if (pos = skipWS(str, pos), str[pos] !== ",") break;
    pos = skipWS(str, pos + 1);
  }
  return str[pos] !== "}" ? { type: "error", message: 'Expected "}" after object', position: pos } : (pos++, marks.push({ name: "object_end", position: pos }), { type: "success", marks, position: pos });
}
function parseString(str, pos) {
  let token = str[pos];
  pos = pos + 1;
  const marks = [{ name: "str", position: pos }];
  str: for (; ; pos++) {
    if (pos > str.length) return { type: "error", message: "Unexpected end of query", position: pos };
    switch (str[pos]) {
      case token: {
        marks.push({ name: "str_end", position: pos }), pos++;
        break str;
      }
      case "\\":
        marks.push({ name: "str_pause", position: pos }), str[pos + 1] === "u" ? str[pos + 2] === "{" ? (marks.push({ name: "unicode_hex", position: pos + 3 }), pos = str.indexOf("}", pos + 3), marks.push({ name: "unicode_hex_end", position: pos })) : (marks.push({ name: "unicode_hex", position: pos + 2 }), marks.push({ name: "unicode_hex_end", position: pos + 6 }), pos += 5) : (marks.push({ name: "single_escape", position: pos + 1 }), pos += 1), marks.push({ name: "str_start", position: pos + 1 });
    }
  }
  return { type: "success", marks, position: pos };
}
function skipWS(str, pos) {
  return pos + parseRegex(str, pos, WS);
}
function parseRegex(str, pos, re) {
  let m = re.exec(str.slice(pos));
  return m ? m[0].length : 0;
}
function parseRegexStr(str, pos, re) {
  let m = re.exec(str.slice(pos));
  return m ? m[0] : null;
}
function parseFunctionDeclaration(str, startPos) {
  let pos = startPos, marks = [], namespace = "", name = "";
  if (str.substring(pos, pos + 2) !== "fn")
    return {
      type: "success",
      position: pos,
      marks
    };
  marks.push({ name: "func_decl", position: startPos }), pos = skipWS(str, pos + 2);
  let identStart = pos;
  if (namespace = parseRegexStr(str, pos, IDENT), !namespace)
    return { type: "error", message: "Expected function name", position: pos };
  if (marks.push(
    { name: "ident", position: identStart },
    { name: "ident_end", position: pos + namespace.length }
  ), pos = skipWS(str, pos + namespace.length), str.substring(pos, pos + 2) !== "::")
    return { type: "error", message: 'Expected "::" after namespace', position: pos };
  if (pos = skipWS(str, pos + 2), name = parseRegexStr(str, pos, IDENT), !name)
    return { type: "error", message: "Expected function name", position: pos };
  if (marks.push({ name: "ident", position: pos }, { name: "ident_end", position: pos + name.length }), pos = skipWS(str, pos + name.length), str[pos] !== "(")
    return { type: "error", message: 'Expected "("', position: pos };
  for (pos = skipWS(str, pos + 1); pos < str.length && str[pos] !== ")"; ) {
    if (str[pos] !== "$")
      return { type: "error", message: 'Parameter should start with "$"', position: pos };
    const startPos2 = pos;
    pos++;
    const paramName = parseRegexStr(str, pos, IDENT);
    if (!paramName)
      return { type: "error", message: "Expected function name", position: pos };
    if (pos += paramName.length, marks.push(
      { name: "param", position: startPos2 },
      { name: "ident", position: startPos2 + 1 },
      { name: "ident_end", position: pos }
    ), pos = skipWS(str, pos), str[pos] === ",")
      pos = skipWS(str, pos + 1);
    else if (str[pos] !== ")")
      return { type: "error", message: 'Expected "," or ")"', position: pos };
  }
  if (str[pos] !== ")")
    return { type: "error", message: 'Expected ")"', position: pos };
  if (marks.push({ name: "func_params_end", position: pos }), pos = skipWS(str, pos + 1), str[pos] !== "=")
    return { type: "error", message: 'Expected "="', position: pos };
  pos = skipWS(str, pos + 1);
  let bodyResult = parseExpr(str, pos, 0);
  return bodyResult.type === "error" ? bodyResult : (marks = marks.concat(bodyResult.marks), pos = skipWS(str, bodyResult.position), str[pos] !== ";" ? { type: "error", message: 'Expected ";" after function declaration', position: pos } : (pos++, {
    type: "success",
    position: pos,
    marks,
    namespace,
    name
  }));
}
function join(a, b) {
  return (base) => b(a(base));
}
function map(inner) {
  return (base) => ({ type: "Map", base, expr: inner({ type: "This" }) });
}
function flatMap(inner) {
  return (base) => ({ type: "FlatMap", base, expr: inner({ type: "This" }) });
}
function traverseArray(build, right) {
  if (!right)
    return {
      type: "a-a",
      build
    };
  switch (right.type) {
    case "a-a":
      return {
        type: "a-a",
        build: join(build, right.build)
      };
    case "a-b":
      return {
        type: "a-b",
        build: join(build, right.build)
      };
    case "b-b":
      return {
        type: "a-a",
        build: join(build, map(right.build))
      };
    case "b-a":
      return {
        type: "a-a",
        build: join(build, flatMap(right.build))
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function traversePlain(mapper, right) {
  if (!right)
    return {
      type: "b-b",
      build: mapper
    };
  switch (right.type) {
    case "a-a":
    case "b-a":
      return {
        type: "b-a",
        build: join(mapper, right.build)
      };
    case "a-b":
    case "b-b":
      return {
        type: "b-b",
        build: join(mapper, right.build)
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function traverseElement(mapper, right) {
  if (!right)
    return {
      type: "a-b",
      build: mapper
    };
  switch (right.type) {
    case "a-a":
    case "b-a":
      return {
        type: "a-a",
        build: join(mapper, right.build)
      };
    case "a-b":
    case "b-b":
      return {
        type: "a-b",
        build: join(mapper, right.build)
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function traverseProjection(mapper, right) {
  if (!right)
    return {
      type: "b-b",
      build: mapper
    };
  switch (right.type) {
    case "a-a":
      return {
        type: "a-a",
        build: join(map(mapper), right.build)
      };
    case "a-b":
      return {
        type: "a-b",
        build: join(map(mapper), right.build)
      };
    case "b-a":
      return {
        type: "b-a",
        build: join(mapper, right.build)
      };
    case "b-b":
      return {
        type: "b-b",
        build: join(mapper, right.build)
      };
    default:
      throw new Error(`unknown type: ${right.type}`);
  }
}
function walkValidateCustomFunction(node, functionParameters, level = 0) {
  switch (node.type) {
    case "Projection":
      return {
        ...node,
        base: walkValidateCustomFunction(node.base, functionParameters, level),
        expr: walkValidateCustomFunction(node.expr, functionParameters, level + 1)
      };
    case "Filter":
      return {
        ...node,
        base: walkValidateCustomFunction(node.base, functionParameters, level),
        expr: walkValidateCustomFunction(node.expr, functionParameters, level + 1)
      };
    case "Parent": {
      if (level - node.n < 0)
        throw new Error(
          `Invalid use of parent operator (^). No parent n ${node.n} at level ${level}.`
        );
      return node;
    }
    case "Parameter": {
      if (functionParameters.find((p) => p.name === node.name))
        throw new Error(
          `Function parameters are not allowed outside function declarations: ${node.name}`
        );
      return node;
    }
    case "Array":
      return {
        ...node,
        elements: node.elements.map((el) => ({
          ...el,
          value: walkValidateCustomFunction(el.value, functionParameters, level)
        }))
      };
    case "PipeFuncCall":
      return {
        ...node,
        base: walkValidateCustomFunction(node.base, functionParameters, level),
        args: node.args.map((arg) => walkValidateCustomFunction(arg, functionParameters, level))
      };
    case "Object":
      return {
        ...node,
        attributes: node.attributes.map((attr) => {
          switch (attr.type) {
            case "ObjectAttributeValue":
              return {
                ...attr,
                value: walkValidateCustomFunction(attr.value, functionParameters, level)
              };
            case "ObjectConditionalSplat":
              return {
                ...attr,
                condition: walkValidateCustomFunction(attr.condition, functionParameters, level),
                value: walkValidateCustomFunction(attr.value, functionParameters, level)
              };
            case "ObjectSplat":
              return {
                ...attr,
                value: walkValidateCustomFunction(attr.value, functionParameters, level)
              };
            default:
              return attr;
          }
        })
      };
    case "FlatMap":
    case "Map":
      return {
        ...node,
        expr: walkValidateCustomFunction(node.expr, functionParameters, level),
        base: walkValidateCustomFunction(node.base, functionParameters, level)
      };
    case "FuncCall":
      return {
        ...node,
        args: node.args.map((arg) => walkValidateCustomFunction(arg, functionParameters, level))
      };
    case "Tuple":
      return {
        ...node,
        members: node.members.map(
          (member) => walkValidateCustomFunction(member, functionParameters, level)
        )
      };
    case "Select": {
      const alternatives = node.alternatives.map((alt) => ({
        ...alt,
        condition: walkValidateCustomFunction(alt.condition, functionParameters, level),
        value: walkValidateCustomFunction(alt.value, functionParameters, level)
      }));
      return node.fallback ? {
        ...node,
        alternatives,
        fallback: walkValidateCustomFunction(node.fallback, functionParameters, level)
      } : {
        ...node,
        alternatives
      };
    }
    case "SelectorNested":
      return {
        ...node,
        base: walkValidateCustomFunction(node.base, functionParameters, level),
        nested: walkValidateCustomFunction(node.nested, functionParameters, level)
      };
    case "SelectorFuncCall":
      return {
        ...node,
        arg: walkValidateCustomFunction(node.arg, functionParameters, level)
      };
    case "AccessAttribute":
    case "AccessElement":
    case "ArrayCoerce":
    case "Asc":
    case "Desc":
    case "Deref":
    case "Group":
    case "Neg":
    case "Not":
    case "Slice":
    case "Pos":
      return node.base ? {
        ...node,
        base: walkValidateCustomFunction(node.base, functionParameters, level)
      } : node;
    case "InRange":
      return {
        ...node,
        base: walkValidateCustomFunction(node.base, functionParameters, level),
        left: walkValidateCustomFunction(node.left, functionParameters, level),
        right: walkValidateCustomFunction(node.right, functionParameters, level)
      };
    case "OpCall":
    case "And":
    case "Or":
      return {
        ...node,
        left: walkValidateCustomFunction(node.left, functionParameters, level),
        right: walkValidateCustomFunction(node.right, functionParameters, level)
      };
    case "Parameter":
    case "Everything":
    case "This":
    case "Value":
    case "Context":
      return node;
    default:
      throw new Error(`Handle all cases: ${node.type}`);
  }
}
const ESCAPE_SEQUENCE = {
  "'": "'",
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: `
`,
  r: "\r",
  t: "	"
};
function expandHex(str) {
  const charCode = parseInt(str, 16);
  return String.fromCharCode(charCode);
}
class GroqQueryError extends Error {
  name = "GroqQueryError";
}
function createExpressionBuilder(parseOptions, recursion = /* @__PURE__ */ new Set()) {
  const exprBuilder = {
    group(p) {
      return {
        type: "Group",
        base: p.process(exprBuilder)
      };
    },
    everything() {
      return { type: "Everything" };
    },
    this() {
      return { type: "This" };
    },
    parent() {
      return {
        type: "Parent",
        n: 1
      };
    },
    dblparent(p) {
      return {
        type: "Parent",
        n: p.process(exprBuilder).n + 1
      };
    },
    traverse(p) {
      const base = p.process(exprBuilder), traversalList = [];
      for (; p.getMark().name !== "traversal_end"; )
        traversalList.push(p.process(TRAVERSE_BUILDER));
      p.shift();
      let traversal = null;
      for (let i = traversalList.length - 1; i >= 0; i--)
        traversal = traversalList[i](traversal);
      if ((base.type === "Everything" || base.type === "Array" || base.type === "PipeFuncCall") && (traversal = traverseArray((val) => val, traversal)), traversal === null) throw new Error("BUG: unexpected empty traversal");
      return traversal.build(base);
    },
    this_attr(p) {
      const name = p.processString();
      return name === "null" ? { type: "Value", value: null } : name === "true" ? { type: "Value", value: !0 } : name === "false" ? { type: "Value", value: !1 } : {
        type: "AccessAttribute",
        name
      };
    },
    neg(p) {
      return {
        type: "Neg",
        base: p.process(exprBuilder)
      };
    },
    pos(p) {
      return {
        type: "Pos",
        base: p.process(exprBuilder)
      };
    },
    add(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op: "+",
        left,
        right
      };
    },
    sub(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op: "-",
        left,
        right
      };
    },
    mul(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op: "*",
        left,
        right
      };
    },
    div(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op: "/",
        left,
        right
      };
    },
    mod(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op: "%",
        left,
        right
      };
    },
    pow(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op: "**",
        left,
        right
      };
    },
    comp(p) {
      const left = p.process(exprBuilder), op = p.processString(), right = p.process(exprBuilder);
      return {
        type: "OpCall",
        op,
        left,
        right
      };
    },
    in_range(p) {
      const base = p.process(exprBuilder), isInclusive = p.getMark().name === "inc_range";
      p.shift();
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "InRange",
        base,
        left,
        right,
        isInclusive
      };
    },
    str(p) {
      let value = "";
      loop: for (; p.hasMark(); ) {
        const mark = p.getMark();
        switch (mark.name) {
          case "str_end":
            value += p.processStringEnd();
            break loop;
          case "str_pause":
            value += p.processStringEnd();
            break;
          case "str_start":
            p.shift();
            break;
          case "single_escape": {
            const char = p.slice(1);
            p.shift(), value += ESCAPE_SEQUENCE[char];
            break;
          }
          case "unicode_hex":
            p.shift(), value += expandHex(p.processStringEnd());
            break;
          default:
            throw new Error(`unexpected mark: ${mark.name}`);
        }
      }
      return { type: "Value", value };
    },
    integer(p) {
      const strValue = p.processStringEnd();
      return {
        type: "Value",
        value: Number(strValue)
      };
    },
    float(p) {
      const strValue = p.processStringEnd();
      return {
        type: "Value",
        value: Number(strValue)
      };
    },
    sci(p) {
      const strValue = p.processStringEnd();
      return {
        type: "Value",
        value: Number(strValue)
      };
    },
    object(p) {
      const attributes = [];
      for (; p.getMark().name !== "object_end"; )
        attributes.push(p.process(OBJECT_BUILDER));
      return p.shift(), {
        type: "Object",
        attributes
      };
    },
    array(p) {
      const elements = [];
      for (; p.getMark().name !== "array_end"; ) {
        let isSplat = !1;
        p.getMark().name === "array_splat" && (isSplat = !0, p.shift());
        const value = p.process(exprBuilder);
        elements.push({
          type: "ArrayElement",
          value,
          isSplat
        });
      }
      return p.shift(), {
        type: "Array",
        elements
      };
    },
    tuple(p) {
      const members = [];
      for (; p.getMark().name !== "tuple_end"; )
        members.push(p.process(exprBuilder));
      return p.shift(), {
        type: "Tuple",
        members
      };
    },
    func_call(p) {
      let namespace = "global";
      p.getMark().name === "namespace" && (p.shift(), namespace = p.processString());
      const name = p.processString();
      if (namespace === "global" && name === "select") {
        const result = {
          type: "Select",
          alternatives: []
        };
        for (; p.getMark().name !== "func_args_end"; )
          if (p.getMark().name === "pair") {
            if (result.fallback) throw new GroqQueryError("unexpected argument to select()");
            p.shift();
            const condition = p.process(exprBuilder), value = p.process(exprBuilder);
            result.alternatives.push({
              type: "SelectAlternative",
              condition,
              value
            });
          } else {
            if (result.fallback) throw new GroqQueryError("unexpected argument to select()");
            const value = p.process(exprBuilder);
            result.fallback = value;
          }
        return p.shift(), result;
      }
      const args = [];
      for (; p.getMark().name !== "func_args_end"; )
        argumentShouldBeSelector(namespace, name, args.length) ? args.push(p.process(SELECTOR_BUILDER)) : args.push(p.process(exprBuilder));
      if (p.shift(), namespace === "global" && (name === "before" || name === "after") && p.parseOptions.mode === "delta")
        return {
          type: "Context",
          key: name
        };
      if (namespace === "global" && name === "boost" && !p.allowBoost)
        throw new GroqQueryError("unexpected boost");
      const customFunction = p.customFunctions[`${namespace}::${name}`];
      if (customFunction !== void 0) {
        const FUNCTION_DECL_BUILDER = createFunctionDeclarationBuilder(parseOptions, recursion), funcDecl = new MarkProcessor(
          p.string,
          customFunction.marks,
          p.customFunctions,
          parseOptions
        ).process(FUNCTION_DECL_BUILDER);
        return validateArity(name, funcDecl.params.length, args.length), mapCustomFunction(
          funcDecl.body,
          (body) => walkValidateCustomFunction(body, funcDecl.params),
          (parameterNode) => resolveFunctionParameter(parameterNode, funcDecl.params, args)
        );
      }
      const funcs = shared.namespaceRegistry[namespace];
      if (!funcs)
        throw new GroqQueryError(`Undefined namespace: ${namespace}`);
      const funcEntry = funcs[name];
      if (!funcEntry)
        throw new GroqQueryError(`Undefined function: ${name}`);
      if (funcEntry.arity !== void 0 && validateArity(name, funcEntry.arity, args.length), funcEntry.mode !== void 0 && funcEntry.mode !== p.parseOptions.mode)
        throw new GroqQueryError(`Undefined function: ${name}`);
      return {
        type: "FuncCall",
        namespace,
        name,
        args
      };
    },
    pipecall(p) {
      const base = p.process(exprBuilder);
      p.shift();
      let namespace = "global";
      if (p.getMark().name === "namespace" && (p.shift(), namespace = p.processString()), namespace !== "global")
        throw new GroqQueryError(`Undefined namespace: ${namespace}`);
      const name = p.processString(), args = [], oldAllowBoost = p.allowBoost;
      for (name === "score" && (p.allowBoost = !0); ; ) {
        const markName = p.getMark().name;
        if (markName === "func_args_end")
          break;
        if (name === "order") {
          if (markName === "asc") {
            p.shift(), args.push({ type: "Asc", base: p.process(exprBuilder) });
            continue;
          } else if (markName === "desc") {
            p.shift(), args.push({ type: "Desc", base: p.process(exprBuilder) });
            continue;
          }
        }
        args.push(p.process(exprBuilder));
      }
      p.shift(), p.allowBoost = oldAllowBoost;
      const funcEntry = shared.pipeFunctionRegistry[name];
      if (!funcEntry)
        throw new GroqQueryError(`Undefined pipe function: ${name}`);
      return funcEntry.arity && validateArity(name, funcEntry.arity, args.length), {
        type: "PipeFuncCall",
        base,
        name,
        args
      };
    },
    pair() {
      throw new GroqQueryError("unexpected =>");
    },
    and(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "And",
        left,
        right
      };
    },
    or(p) {
      const left = p.process(exprBuilder), right = p.process(exprBuilder);
      return {
        type: "Or",
        left,
        right
      };
    },
    not(p) {
      return {
        type: "Not",
        base: p.process(exprBuilder)
      };
    },
    asc() {
      throw new GroqQueryError("unexpected asc");
    },
    desc() {
      throw new GroqQueryError("unexpected desc");
    },
    param(p) {
      const name = p.processString();
      return p.parseOptions.params && p.parseOptions.params.hasOwnProperty(name) ? {
        type: "Value",
        value: p.parseOptions.params[name]
      } : {
        type: "Parameter",
        name
      };
    }
  }, OBJECT_BUILDER = {
    object_expr(p) {
      if (p.getMark().name === "pair") {
        p.shift();
        const condition = p.process(exprBuilder), value2 = p.process(exprBuilder);
        return {
          type: "ObjectConditionalSplat",
          condition,
          value: value2
        };
      }
      const value = p.process(exprBuilder);
      return {
        type: "ObjectAttributeValue",
        name: extractPropertyKey(value),
        value
      };
    },
    object_pair(p) {
      const name = p.process(exprBuilder);
      if (name.type !== "Value") throw new Error("name must be string");
      const value = p.process(exprBuilder);
      return {
        type: "ObjectAttributeValue",
        name: name.value,
        value
      };
    },
    object_splat(p) {
      return {
        type: "ObjectSplat",
        value: p.process(exprBuilder)
      };
    },
    object_splat_this() {
      return {
        type: "ObjectSplat",
        value: { type: "This" }
      };
    }
  }, TRAVERSE_BUILDER = {
    square_bracket(p) {
      const expr = p.process(exprBuilder), value = shared.tryConstantEvaluate(expr);
      return value && value.type === "number" ? (right) => traverseElement((base) => ({ type: "AccessElement", base, index: value.data }), right) : value && value.type === "string" ? (right) => traversePlain((base) => ({ type: "AccessAttribute", base, name: value.data }), right) : (right) => traverseArray(
        (base) => ({
          type: "Filter",
          base,
          expr
        }),
        right
      );
    },
    slice(p) {
      const isInclusive = p.getMark().name === "inc_range";
      p.shift();
      const left = p.process(exprBuilder), right = p.process(exprBuilder), leftValue = shared.tryConstantEvaluate(left), rightValue = shared.tryConstantEvaluate(right);
      if (!leftValue || !rightValue || leftValue.type !== "number" || rightValue.type !== "number")
        throw new GroqQueryError("slicing must use constant numbers");
      return (rhs) => traverseArray(
        (base) => ({
          type: "Slice",
          base,
          left: leftValue.data,
          right: rightValue.data,
          isInclusive
        }),
        rhs
      );
    },
    projection(p) {
      const obj = p.process(exprBuilder);
      return (right) => traverseProjection((base) => ({ type: "Projection", base, expr: obj }), right);
    },
    attr_access(p) {
      const name = p.processString();
      return (right) => traversePlain((base) => ({ type: "AccessAttribute", base, name }), right);
    },
    deref(p) {
      let attr = null;
      p.getMark().name === "deref_attr" && (p.shift(), attr = p.processString());
      const wrap = (base) => attr ? { type: "AccessAttribute", base, name: attr } : base;
      return (right) => traversePlain(
        (base) => wrap({
          type: "Deref",
          base
        }),
        right
      );
    },
    array_postfix() {
      return (right) => traverseArray((base) => ({ type: "ArrayCoerce", base }), right);
    }
  }, SELECTOR_BUILDER = {
    group(p) {
      return p.process(SELECTOR_BUILDER);
    },
    everything() {
      throw new Error("Invalid selector syntax");
    },
    this() {
      throw new Error("Invalid selector syntax");
    },
    parent() {
      throw new Error("Invalid selector syntax");
    },
    dblparent() {
      throw new Error("Invalid selector syntax");
    },
    traverse(p) {
      let node = p.process(SELECTOR_BUILDER);
      for (; p.getMark().name !== "traversal_end"; )
        if (p.getMark().name === "array_postfix")
          p.shift(), node = { type: "ArrayCoerce", base: node };
        else if (p.getMark().name === "square_bracket") {
          p.shift();
          const expr = p.process(exprBuilder), value = shared.tryConstantEvaluate(expr);
          if (value && value.type === "number")
            throw new Error("Invalid array access expression");
          value && value.type === "string" ? node = { type: "AccessAttribute", base: node, name: value.data } : node = { type: "Filter", base: node, expr };
        } else if (p.getMark().name === "attr_access") {
          p.shift();
          const name = p.processString();
          node = { type: "AccessAttribute", base: node, name };
        } else if (p.getMark().name === "tuple" || p.getMark().name === "group") {
          const selector = p.process(SELECTOR_BUILDER);
          if (!shared.isSelectorNested(selector))
            throw new Error(`Unexpected result parsing nested selector: ${selector.type}`);
          node = { type: "SelectorNested", base: node, nested: selector };
        } else
          throw new Error("Invalid selector syntax");
      return p.shift(), node;
    },
    this_attr(p) {
      return { type: "AccessAttribute", name: p.processString() };
    },
    attr_access() {
      throw new Error("Invalid selector syntax");
    },
    neg() {
      throw new Error("Invalid selector syntax");
    },
    pos() {
      throw new Error("Invalid selector syntax");
    },
    add() {
      throw new Error("Invalid selector syntax");
    },
    sub() {
      throw new Error("Invalid selector syntax");
    },
    mul() {
      throw new Error("Invalid selector syntax");
    },
    div() {
      throw new Error("Invalid selector syntax");
    },
    mod() {
      throw new Error("Invalid selector syntax");
    },
    pow() {
      throw new Error("Invalid selector syntax");
    },
    comp() {
      throw new Error("Invalid selector syntax");
    },
    in_range() {
      throw new Error("Invalid selector syntax");
    },
    str() {
      throw new Error("Invalid selector syntax");
    },
    integer() {
      throw new Error("Invalid selector syntax");
    },
    float() {
      throw new Error("Invalid selector syntax");
    },
    sci() {
      throw new Error("Invalid selector syntax");
    },
    object() {
      throw new Error("Invalid selector syntax");
    },
    array() {
      throw new Error("Invalid selector syntax");
    },
    tuple(p) {
      const selectors = [];
      for (; p.getMark().name !== "tuple_end"; )
        selectors.push(p.process(SELECTOR_BUILDER));
      return p.shift(), { type: "Tuple", members: selectors };
    },
    func_call(p, mark) {
      const func = exprBuilder.func_call(p, mark);
      if (func.name === "anywhere" && func.args.length === 1)
        return {
          type: "SelectorFuncCall",
          name: "anywhere",
          arg: func.args[0]
        };
      throw new Error("Invalid selector syntax");
    },
    pipecall() {
      throw new Error("Invalid selector syntax");
    },
    pair() {
      throw new Error("Invalid selector syntax");
    },
    and() {
      throw new Error("Invalid selector syntax");
    },
    or() {
      throw new Error("Invalid selector syntax");
    },
    not() {
      throw new Error("Invalid selector syntax");
    },
    asc() {
      throw new Error("Invalid selector syntax");
    },
    desc() {
      throw new Error("Invalid selector syntax");
    },
    param() {
      throw new Error("Invalid selector syntax");
    }
  };
  return exprBuilder;
}
function extractPropertyKey(node) {
  if (node.type === "AccessAttribute" && !node.base)
    return node.name;
  if (node.type === "PipeFuncCall" || node.type === "Deref" || node.type === "Map" || node.type === "FlatMap" || node.type === "Projection" || node.type === "Slice" || node.type === "Filter" || node.type === "AccessElement" || node.type === "ArrayCoerce" || node.type === "Group")
    return extractPropertyKey(node.base);
  throw new GroqQueryError(`Cannot determine property key for type: ${node.type}`);
}
function validateArity(name, arity, count) {
  if (typeof arity == "number") {
    if (count !== arity)
      throw new GroqQueryError(
        `Incorrect number of arguments to function ${name}(). Expected ${arity}, got ${count}.`
      );
  } else if (arity && !arity(count))
    throw new GroqQueryError(`Incorrect number of arguments to function ${name}().`);
}
function resolveFunctionParameter(parameter, params, args) {
  if (parameter.type !== "Parameter")
    throw new GroqQueryError(`Expected parameter node, got ${parameter.type}`);
  const index = params.findIndex((p) => p.name === parameter.name);
  if (index === -1)
    throw new GroqQueryError(`Missing argument for parameter ${parameter.name} in function call`);
  return args[index];
}
function mapCustomFunction(body, bodyMapper, parameterMapper = (n) => n) {
  if (body.type === "Projection") {
    if (body.base.type === "Parameter")
      return {
        type: "Projection",
        base: parameterMapper(body.base),
        expr: bodyMapper(body.expr)
      };
    if (body.base.type === "Deref" && body.base.base.type === "Parameter")
      return {
        type: "Projection",
        base: {
          type: "Deref",
          base: parameterMapper(body.base.base)
        },
        expr: bodyMapper(body.expr)
      };
  }
  if (body.type === "Map" && body.base.type === "ArrayCoerce" && body.base.base.type === "Parameter")
    return {
      type: "Map",
      base: {
        type: "ArrayCoerce",
        base: parameterMapper(body.base.base)
      },
      expr: bodyMapper(body.expr)
    };
  throw new GroqQueryError(`Unexpected function body, must be a projection. Got "${body.type}"`);
}
function argumentShouldBeSelector(namespace, functionName, argCount) {
  const functionsRequiringSelectors = ["changedAny", "changedOnly"];
  return namespace == "diff" && argCount == 2 && functionsRequiringSelectors.includes(functionName);
}
class GroqSyntaxError extends Error {
  /**
   * 0-based UTF-16 code unit offset from the start of the query string.
   */
  position;
  /**
   * 1-based line number where the error occurred.
   */
  line;
  /**
   * 1-based column number within the line, in UTF-16 code units.
   */
  column;
  name = "GroqSyntaxError";
  constructor(position, query, detail) {
    super(`Syntax error in GROQ query at position ${position}${detail ? `: ${detail}` : ""}`), this.position = position;
    let line = 1, lineStart = 0;
    for (let i = 0; i < position && i < query.length; i++)
      query[i] === `
` && (line++, lineStart = i + 1);
    this.line = line, this.column = position - lineStart + 1;
  }
}
function parse(input, options = {}) {
  const result = parse$1(input);
  if (result.type === "error")
    throw new GroqSyntaxError(result.position, input, result.message);
  validateCustomFunctions(input, result.customFunctions, options);
  const processor = new MarkProcessor(input, result.marks, result.customFunctions, options), exprBuilder = createExpressionBuilder(options);
  return processor.process(exprBuilder);
}
function createFunctionDeclarationBuilder(parseOptions, recursion = /* @__PURE__ */ new Set()) {
  return {
    func_decl(p) {
      const namespace = p.processString(), name = p.processString(), functionId = `${namespace}::${name}`;
      if (recursion.has(functionId))
        throw new GroqQueryError(`Recursive function definition detected for ${functionId}`);
      const exprBuilder = createExpressionBuilder(parseOptions, /* @__PURE__ */ new Set([...recursion, functionId])), params = [];
      for (; p.getMark().name !== "func_params_end"; ) {
        const param = p.process(exprBuilder);
        if (param.type !== "Parameter") throw new Error("expected parameter");
        params.push(param);
      }
      if (params.length !== 1)
        throw new GroqQueryError("Custom functions can only have one parameter");
      p.shift();
      const body = p.process(exprBuilder);
      return {
        type: "FuncDeclaration",
        namespace,
        name,
        params,
        body
      };
    }
  };
}
function validateCustomFunctions(query, customFunctions, parseOptions) {
  for (const functionId in customFunctions) {
    if (!customFunctions.hasOwnProperty(functionId)) continue;
    const customFunction = customFunctions[functionId], processor = new MarkProcessor(query, customFunction.marks, customFunctions, parseOptions), FUNCTION_DECL_BUILDER = createFunctionDeclarationBuilder(parseOptions), funcDecl = processor.process(FUNCTION_DECL_BUILDER);
    mapCustomFunction(funcDecl.body, (body) => walkValidateCustomFunction(body, funcDecl.params));
  }
}
const { compare } = new Intl.Collator("en");
function typeNodesSorter(a, b) {
  return a.type === "null" ? 1 : compare(hashField(a), hashField(b));
}
const hashCache = /* @__PURE__ */ new WeakMap();
function hashField(field) {
  if (hashCache.has(field))
    return hashCache.get(field);
  const hash = calculateFieldHash(field);
  return hashCache.set(field, hash), hash;
}
function calculateFieldHash(field) {
  switch (field.type) {
    case "number":
    case "boolean":
      return field.value !== void 0 ? `${field.type}(${field.value})` : `${field.type}`;
    case "string":
      return isDateTime(field) && field.value !== void 0 ? `${field.type}(${field.value}):datetime` : isDateTime(field) ? `${field.type}:datetime` : field.value !== void 0 ? `${field.type}(${field.value})` : `${field.type}`;
    case "null":
    case "unknown":
      return field.type;
    case "array":
      return `${field.type}(${hashField(field.of)})`;
    case "object": {
      const attributes = Object.entries(field.attributes);
      return attributes.sort(([a], [b]) => compare(a, b)), `${field.type}:(${attributes.map(
        ([key, value]) => `${key}:${hashField(value.value)}(${value.optional ? "optional" : "non-optional"})`
      ).join(",")}):ref-${field.dereferencesTo}:${field.rest ? hashField(field.rest) : "no-rest"}`;
    }
    case "union": {
      const sorted = [...field.of];
      return sorted.sort(typeNodesSorter), `${field.type}(${sorted.map(hashField).join(",")})`;
    }
    case "inline":
      return `${field.type}(${field.name})`;
    default:
      return field.type;
  }
}
function removeDuplicateTypeNodes(typeNodes) {
  const seenTypes = /* @__PURE__ */ new Set(), newTypeNodes = [], sortedTypeNodes = [...typeNodes];
  sortedTypeNodes.sort(typeNodesSorter);
  for (const typeNode of sortedTypeNodes) {
    const hash = hashField(typeNode);
    if (hash === null) {
      newTypeNodes.push(typeNode);
      continue;
    }
    seenTypes.has(hash) || (seenTypes.add(hash), newTypeNodes.push(typeNode));
  }
  return newTypeNodes;
}
function optimizeUnions(field) {
  if (field.type === "union") {
    if (field.of.length === 0)
      return field;
    if (field.of = removeDuplicateTypeNodes(field.of), field.of.length === 1)
      return optimizeUnions(field.of[0]);
    for (let idx = 0; field.of.length > idx; idx++) {
      const subField = field.of[idx];
      if (subField.type === "union") {
        field.of.splice(idx, 1, ...subField.of), idx--;
        continue;
      }
      field.of[idx] = optimizeUnions(subField);
    }
    return field.of.sort((a, b) => a.type === "null" ? 1 : compare(hashField(a), hashField(b))), field;
  }
  if (field.type === "array")
    return field.of = optimizeUnions(field.of), field;
  if (field.type === "object") {
    for (const idx in field.attributes)
      Object.hasOwn(field.attributes, idx) && (field.attributes[idx].value = optimizeUnions(field.attributes[idx].value));
    return field;
  }
  return field;
}
const STRING_TYPE_DATETIME = /* @__PURE__ */ Symbol("groq-js.type.string_datetime");
function createReferenceTypeNode(name, inArray = !1) {
  const attributes = {
    _ref: {
      type: "objectAttribute",
      value: {
        type: "string"
      }
    },
    _type: {
      type: "objectAttribute",
      value: {
        type: "string",
        value: "reference"
      }
    },
    _weak: {
      type: "objectAttribute",
      value: {
        type: "boolean"
      },
      optional: !0
    }
  };
  return inArray && (attributes._key = {
    type: "objectAttribute",
    value: {
      type: "string"
    }
  }), {
    type: "object",
    attributes,
    dereferencesTo: name
  };
}
function createObjectAttribute(value, optional) {
  return optional === void 0 ? {
    type: "objectAttribute",
    value
  } : {
    type: "objectAttribute",
    value,
    optional
  };
}
function nullUnion(node) {
  return node.type === "union" ? unionOf(...node.of, { type: "null" }) : unionOf(node, { type: "null" });
}
function unionOf(...nodes) {
  return nodes.length === 1 ? nodes[0] : {
    type: "union",
    of: nodes
  };
}
function dateTimeString() {
  return {
    type: "string",
    [STRING_TYPE_DATETIME]: !0
  };
}
function resolveInline(node, scope) {
  if (node.type === "inline") {
    const resolvedInline = scope.context.lookupTypeDeclaration(node);
    return resolveInline(resolvedInline, scope);
  }
  return node;
}
function mapNode(node, scope, mapper, mergeUnions = (nodes) => optimizeUnions({ type: "union", of: nodes })) {
  switch (node.type) {
    case "boolean":
    case "array":
    case "null":
    case "object":
    case "string":
    case "number":
    case "unknown":
      return mapper(node);
    case "union":
      return mergeUnions(node.of.map((inner) => mapNode(inner, scope, mapper), mergeUnions));
    case "inline": {
      const resolvedInline = resolveInline(node, scope);
      return mapNode(resolvedInline, scope, mapper, mergeUnions);
    }
    default:
      throw new Error(`Unknown type: ${node.type}`);
  }
}
function isFuncCall(node, name) {
  return node.type === "Group" ? isFuncCall(node.base, name) : node.type === "FuncCall" && `${node.namespace}::${node.name}` === name;
}
function isString(node) {
  return node.type === "string" && !node[STRING_TYPE_DATETIME];
}
function isDateTime(node) {
  return !!(node.type === "string" && node[STRING_TYPE_DATETIME]);
}
function containsDateTime(node) {
  if (isDateTime(node)) return !0;
  if (node.type === "array") {
    if (isDateTime(node.of)) return !0;
    if (node.of.type === "union")
      return node.of.of.some((member) => isDateTime(member));
  }
  return !1;
}
function createGeoJson(type = "Point") {
  let coordinateAttribute = {
    type: "array",
    of: {
      type: "number"
    }
  };
  return type === "LineString" && (coordinateAttribute = {
    type: "array",
    of: {
      type: "array",
      of: {
        type: "number"
      }
    }
  }), type === "Polygon" && (coordinateAttribute = {
    type: "array",
    of: {
      type: "array",
      of: {
        type: "array",
        of: {
          type: "number"
        }
      }
    }
  }), {
    type: "object",
    attributes: {
      type: {
        type: "objectAttribute",
        value: {
          type: "string",
          value: type
        }
      },
      coordinates: {
        type: "objectAttribute",
        value: coordinateAttribute
      }
    }
  };
}
function booleanValue(node, scope) {
  switch (node.type) {
    case "unknown":
      return { canBeTrue: !0, canBeFalse: !0, canBeNull: !0 };
    case "boolean":
      return node.value === !0 ? { canBeTrue: !0, canBeFalse: !1, canBeNull: !1 } : node.value === !1 ? { canBeTrue: !1, canBeFalse: !0, canBeNull: !1 } : { canBeTrue: !0, canBeFalse: !0, canBeNull: !1 };
    case "union": {
      const value = { canBeTrue: !1, canBeFalse: !1, canBeNull: !1 };
      for (const sub of node.of) {
        const match2 = booleanValue(sub, scope);
        match2.canBeNull && (value.canBeNull = !0), match2.canBeTrue && (value.canBeTrue = !0), match2.canBeFalse && (value.canBeFalse = !0);
      }
      return value;
    }
    case "inline": {
      const resolved = resolveInline(node, scope);
      return booleanValue(resolved, scope);
    }
    case "null":
    case "string":
    case "number":
    case "object":
    case "array":
      return { canBeTrue: !1, canBeFalse: !1, canBeNull: !0 };
    default:
      throw new Error(`unknown node type ${node.type}`);
  }
}
function booleanOr(left, right) {
  return left.canBeTrue && !left.canBeFalse && !left.canBeNull ? left : right.canBeTrue && !right.canBeFalse && !right.canBeNull ? right : {
    // Either side can be true for the expression to be true
    canBeTrue: left.canBeTrue || right.canBeTrue,
    // Both sides must be false for the expression to be false
    canBeFalse: left.canBeFalse && right.canBeFalse,
    // if either side can be null, the expression can be null if the other side can't only be true
    canBeNull: left.canBeNull || right.canBeNull
  };
}
function booleanAnd(left, right) {
  return left.canBeFalse && !left.canBeTrue && !left.canBeNull ? left : right.canBeFalse && !right.canBeTrue && !right.canBeNull ? right : {
    // Both sides must be true for the expression to be true
    canBeTrue: left.canBeTrue && right.canBeTrue,
    // if either side can be false, the expression can be false
    canBeFalse: left.canBeFalse || right.canBeFalse,
    // if either side can be null, the expression can be null
    canBeNull: left.canBeNull || right.canBeNull
  };
}
function booleanInterpretationToTypeNode(bool) {
  return bool.canBeTrue ? bool.canBeFalse ? bool.canBeNull ? nullUnion({ type: "boolean" }) : { type: "boolean" } : bool.canBeNull ? nullUnion({ type: "boolean", value: !0 }) : { type: "boolean", value: !0 } : bool.canBeFalse ? bool.canBeNull ? nullUnion({ type: "boolean", value: !1 }) : { type: "boolean", value: !1 } : { type: "null" };
}
function unionWithoutNull(unionTypeNode) {
  return unionTypeNode.type === "union" ? {
    type: "union",
    of: unionTypeNode.of.filter((type) => type.type !== "null")
  } : unionTypeNode;
}
function handleFuncCallNode(node, scope) {
  switch (`${node.namespace}.${node.name}`) {
    case "array.compact": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => {
        if (arg2.type === "unknown")
          return nullUnion({ type: "array", of: { type: "unknown" } });
        if (arg2.type !== "array")
          return { type: "null" };
        const of = mapNode(arg2.of, scope, (of2) => of2);
        return {
          type: "array",
          of: unionWithoutNull(of)
        };
      });
    }
    case "array.join": {
      const arrayArg = walk({ node: node.args[0], scope }), sepArg = walk({ node: node.args[1], scope });
      return mapNode(
        arrayArg,
        scope,
        (arrayArg2) => mapNode(sepArg, scope, (sepArg2) => arrayArg2.type === "unknown" || sepArg2.type === "unknown" ? nullUnion({ type: "string" }) : arrayArg2.type !== "array" || !isString(sepArg2) ? { type: "null" } : mapNode(arrayArg2.of, scope, (of) => of.type === "unknown" ? nullUnion({ type: "string" }) : of.type !== "string" && of.type !== "number" && of.type !== "boolean" ? { type: "null" } : { type: "string" }))
      );
    }
    case "array.unique": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" ? nullUnion({ type: "array", of: { type: "unknown" } }) : arg2.type !== "array" ? { type: "null" } : arg2);
    }
    case "array.intersects": {
      const arg1 = walk({ node: node.args[0], scope }), arg2 = walk({ node: node.args[1], scope });
      return mapNode(
        arg1,
        scope,
        (arg12) => mapNode(arg2, scope, (arg22) => arg12.type !== "array" ? { type: "null" } : arg22.type !== "array" ? { type: "null" } : { type: "boolean" })
      );
    }
    case "global.lower": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" ? nullUnion({ type: "string" }) : isString(arg2) ? arg2.value !== void 0 ? {
        type: "string",
        value: arg2.value.toLowerCase()
      } : { type: "string" } : { type: "null" });
    }
    case "global.upper": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" ? nullUnion({ type: "string" }) : isString(arg2) ? arg2.value !== void 0 ? {
        type: "string",
        value: arg2.value.toUpperCase()
      } : { type: "string" } : { type: "null" });
    }
    case "dateTime.now":
      return dateTimeString();
    case "global.now":
      return { type: "string" };
    case "global.defined": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (node2) => node2.type === "unknown" ? { type: "boolean" } : { type: "boolean", value: node2.type !== "null" });
    }
    case "global.path": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" ? nullUnion({ type: "string" }) : arg2.type === "string" ? { type: "string" } : { type: "null" });
    }
    case "global.coalesce": {
      if (node.args.length === 0)
        return { type: "null" };
      const typeNodes = [];
      let canBeNull = !0;
      for (const arg of node.args) {
        const argNode = optimizeUnions(walk({ node: arg, scope })), allNull = argNode.type === "null" || argNode.type === "union" && argNode.of.every((t) => t.type === "null");
        if (canBeNull = allNull || argNode.type === "unknown" || argNode.type === "union" && argNode.of.some((t) => t.type === "null" || t.type === "unknown"), allNull || typeNodes.push(unionWithoutNull(argNode)), !canBeNull)
          break;
      }
      return canBeNull && typeNodes.push({ type: "null" }), {
        type: "union",
        of: typeNodes
      };
    }
    case "global.count": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" ? nullUnion({ type: "string" }) : arg2.type === "array" ? { type: "number" } : { type: "null" });
    }
    case "global.dateTime": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" || arg2.type === "string" ? nullUnion(dateTimeString()) : { type: "null" });
    }
    case "global.length": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (arg2) => arg2.type === "unknown" ? nullUnion({ type: "number" }) : arg2.type === "array" || isString(arg2) ? { type: "number" } : { type: "null" });
    }
    case "global.references":
      return { type: "boolean" };
    case "global.round": {
      const numNode = walk({ node: node.args[0], scope });
      return mapNode(numNode, scope, (num) => {
        if (num.type === "unknown")
          return nullUnion({ type: "number" });
        if (num.type !== "number")
          return { type: "null" };
        if (node.args.length === 2) {
          const precisionNode = walk({ node: node.args[1], scope });
          return mapNode(precisionNode, scope, (precision) => precision.type === "unknown" ? nullUnion({ type: "number" }) : precision.type !== "number" ? { type: "null" } : { type: "number" });
        }
        return { type: "number" };
      });
    }
    case "global.string": {
      const arg = walk({ node: node.args[0], scope });
      return mapNode(arg, scope, (node2) => node2.type === "unknown" ? nullUnion({ type: "string" }) : node2.type === "string" || node2.type === "number" || node2.type === "boolean" ? node2.value ? {
        type: "string",
        value: node2.value.toString()
      } : {
        type: "string"
      } : { type: "null" });
    }
    case "math.sum": {
      const values = walk({ node: node.args[0], scope });
      return mapNode(values, scope, (node2) => node2.type === "unknown" ? nullUnion({ type: "number" }) : node2.type !== "array" ? { type: "null" } : mapNode(node2.of, scope, (node3) => node3.type === "unknown" ? nullUnion({ type: "number" }) : node3.type === "number" || node3.type === "null" ? { type: "number" } : { type: "null" }));
    }
    case "math.avg": {
      const values = walk({ node: node.args[0], scope });
      return mapNode(values, scope, (node2) => node2.type === "unknown" ? nullUnion({ type: "number" }) : node2.type !== "array" ? { type: "null" } : mapNode(node2.of, scope, (node3) => node3.type === "unknown" ? nullUnion({ type: "number" }) : node3.type === "number" ? { type: "number" } : { type: "null" }));
    }
    case "math.max":
    case "math.min": {
      const values = walk({ node: node.args[0], scope });
      return mapNode(values, scope, (node2) => node2.type === "unknown" ? nullUnion({ type: "number" }) : node2.type !== "array" ? { type: "null" } : mapNode(node2.of, scope, (node3) => node3.type === "unknown" ? nullUnion({ type: "number" }) : node3.type === "number" ? node3 : { type: "null" }));
    }
    case "pt.text":
      return node.args.length === 0 ? { type: "null" } : {
        type: "string"
      };
    case "string.startsWith": {
      const strTypeNode = walk({ node: node.args[0], scope }), prefixTypeNode = walk({ node: node.args[1], scope });
      return mapNode(strTypeNode, scope, (strNode) => mapNode(prefixTypeNode, scope, (prefixNode) => strNode.type === "unknown" || prefixNode.type === "unknown" ? nullUnion({ type: "boolean" }) : strNode.type !== "string" || prefixNode.type !== "string" ? { type: "null" } : { type: "boolean" }));
    }
    case "string.split": {
      const strTypeNode = walk({ node: node.args[0], scope }), sepTypeNode = walk({ node: node.args[1], scope });
      return mapNode(strTypeNode, scope, (strNode) => mapNode(sepTypeNode, scope, (sepNode) => strNode.type === "unknown" || sepNode.type === "unknown" ? nullUnion({ type: "array", of: { type: "string" } }) : strNode.type !== "string" || sepNode.type !== "string" ? { type: "null" } : { type: "array", of: { type: "string" } }));
    }
    case "geo.latLng": {
      const latTypeNode = walk({ node: node.args[0], scope }), lngTypeNode = walk({ node: node.args[1], scope });
      return mapNode(latTypeNode, scope, (latNode) => mapNode(lngTypeNode, scope, (lngNode) => latNode.type == "unknown" || lngNode.type == "unknown" ? nullUnion(createGeoJson()) : latNode.type !== "number" || lngNode.type !== "number" ? { type: "null" } : nullUnion(createGeoJson())));
    }
    case "geo.contains":
      return nullUnion({ type: "boolean" });
    case "geo.intersects":
      return nullUnion({ type: "boolean" });
    case "geo.distance":
      return nullUnion({ type: "number" });
    case "sanity.projectId":
    case "sanity.dataset":
      return nullUnion({ type: "string" });
    case "sanity.versionOf": {
      const typeNode = walk({ node: node.args[0], scope });
      return mapNode(typeNode, scope, (typeNode2) => typeNode2.type === "unknown" ? nullUnion({ type: "boolean" }) : typeNode2.type !== "string" ? { type: "null" } : { type: "boolean" });
    }
    case "sanity.partOfRelease": {
      const typeNode = walk({ node: node.args[0], scope });
      return mapNode(typeNode, scope, (typeNode2) => typeNode2.type === "unknown" ? nullUnion({ type: "boolean" }) : typeNode2.type !== "string" ? { type: "null" } : { type: "boolean" });
    }
    case "documents.get": {
      const typeNode = walk({ node: node.args[0], scope });
      return mapNode(typeNode, scope, (typeNode2) => typeNode2.type === "unknown" ? typeNode2 : typeNode2.type !== "object" ? { type: "null" } : { type: "unknown" });
    }
    case "documents.incomingRefCount":
      return { type: "number" };
    case "documents.incomingGlobalDocumentReferenceCount":
      return { type: "number" };
    case "media.aspect":
      return mapNode(walk({ node: node.args[0], scope }), scope, (fieldNode) => fieldNode.type === "null" ? { type: "null" } : mapNode(walk({ node: node.args[1], scope }), scope, (aspectNode) => aspectNode.type !== "string" ? { type: "null" } : { type: "unknown" }));
    case "user.attributes":
      return { type: "unknown" };
    default:
      return { type: "unknown" };
  }
}
function match(left, right) {
  let tokens = [], patterns = [];
  if (left.type === "string") {
    if (left.value === void 0)
      return;
    tokens = tokens.concat(shared.matchTokenize(left.value));
  }
  if (left.type === "array") {
    if (left.of.type === "unknown")
      return;
    if (left.of.type === "string") {
      if (left.of.value === void 0)
        return;
      tokens = tokens.concat(shared.matchTokenize(left.of.value));
    }
    if (left.of.type === "union")
      for (const node of left.of.of)
        node.type === "string" && node.value !== void 0 && (tokens = tokens.concat(shared.matchTokenize(node.value)));
  }
  if (right.type === "string") {
    if (right.value === void 0)
      return;
    patterns = patterns.concat(shared.matchAnalyzePattern(right.value));
  }
  if (right.type === "array") {
    if (right.of.type === "unknown")
      return;
    if (right.of.type === "string") {
      if (right.of.value === void 0)
        return;
      patterns = patterns.concat(shared.matchAnalyzePattern(right.of.value));
    }
    if (right.of.type === "union")
      for (const node of right.of.of) {
        if (node.type === "string") {
          if (node.value === void 0)
            return;
          patterns = patterns.concat(shared.matchAnalyzePattern(node.value));
        }
        if (node.type !== "string")
          return !1;
      }
  }
  return shared.matchText(tokens, patterns);
}
function extractAttributePath(node) {
  if (node.type === "AccessAttribute") {
    if (node.base) {
      const basePath = extractAttributePath(node.base);
      return basePath ? [...basePath, node.name] : null;
    }
    return [node.name];
  }
  return node.type === "Group" ? extractAttributePath(node.base) : null;
}
function extractLiteralType(node) {
  if (node.type === "Value") {
    if (typeof node.value == "string")
      return { type: "string", value: node.value };
    if (typeof node.value == "number")
      return { type: "number", value: node.value };
    if (typeof node.value == "boolean")
      return { type: "boolean", value: node.value };
    if (node.value === null)
      return { type: "null" };
  }
  return null;
}
function extractNarrowingAssertions(expr, negated = !1) {
  switch (expr.type) {
    case "Group":
      return extractNarrowingAssertions(expr.base, negated);
    case "Not":
      return extractNarrowingAssertions(expr.base, !negated);
    case "And":
      return negated ? [] : [
        ...extractNarrowingAssertions(expr.left, negated),
        ...extractNarrowingAssertions(expr.right, negated)
      ];
    case "Or":
      return negated ? [
        ...extractNarrowingAssertions(expr.left, negated),
        ...extractNarrowingAssertions(expr.right, negated)
      ] : [];
    case "FuncCall": {
      if (expr.namespace === "global" && expr.name === "defined" && expr.args.length === 1) {
        const path = extractAttributePath(expr.args[0]);
        if (path)
          return [
            {
              path,
              action: negated ? "notDefined" : "defined"
            }
          ];
      }
      return [];
    }
    case "OpCall": {
      const leftPath = extractAttributePath(expr.left), rightPath = extractAttributePath(expr.right), leftLiteral = extractLiteralType(expr.left), rightLiteral = extractLiteralType(expr.right);
      if (expr.op === "==" || expr.op === "!=") {
        const isEquality = expr.op === "==", effectiveEquality = negated ? !isEquality : isEquality;
        if (leftPath && rightLiteral?.type === "null")
          return [
            {
              path: leftPath,
              action: effectiveEquality ? "notDefined" : "defined"
            }
          ];
        if (rightPath && leftLiteral?.type === "null")
          return [
            {
              path: rightPath,
              action: effectiveEquality ? "notDefined" : "defined"
            }
          ];
        if (effectiveEquality) {
          if (leftPath && rightLiteral && rightLiteral.type !== "null")
            return [
              {
                path: leftPath,
                action: "equals",
                value: rightLiteral
              }
            ];
          if (rightPath && leftLiteral && leftLiteral.type !== "null")
            return [
              {
                path: rightPath,
                action: "equals",
                value: leftLiteral
              }
            ];
        }
      }
      return [];
    }
    default:
      return [];
  }
}
function applyAssertionsToObject(node, assertions, currentDepth = 0, isOptionalPath = !1) {
  const narrowedAttributes = {};
  let hasChanges = !1;
  for (const [name, attr] of Object.entries(node.attributes)) {
    const matchingAssertions = assertions.filter((a) => a.path[currentDepth] === name);
    if (matchingAssertions.length > 0) {
      const thisPathIsOptional = isOptionalPath || attr.optional === !0, terminalAssertions = matchingAssertions.filter(
        (a) => a.path.length === currentDepth + 1
      ), deeperAssertions = matchingAssertions.filter((a) => a.path.length > currentDepth + 1);
      let newAttr = attr, shouldRemoveAttr = !1;
      for (const assertion of terminalAssertions)
        switch (assertion.action) {
          case "defined": {
            if (newAttr.optional && (newAttr = createObjectAttribute(newAttr.value), hasChanges = !0), newAttr.value.type === "union") {
              const nonNullTypes = newAttr.value.of.filter((t) => t.type !== "null");
              nonNullTypes.length !== newAttr.value.of.length && (newAttr = createObjectAttribute(unionOf(...nonNullTypes)), hasChanges = !0);
            }
            break;
          }
          case "notDefined": {
            attr.optional === !0 ? (newAttr = createObjectAttribute({ type: "null" }), hasChanges = !0) : (shouldRemoveAttr = !0, hasChanges = !0);
            break;
          }
          case "equals": {
            newAttr = createObjectAttribute(assertion.value), hasChanges = !0;
            break;
          }
          default:
            throw new Error(`Unhandled assertion action: ${assertion.action.toString()}`);
        }
      if (deeperAssertions.length > 0) {
        if (attr.optional && (newAttr = createObjectAttribute(newAttr.value), hasChanges = !0), newAttr.value.type === "object") {
          const narrowedValue = applyAssertionsToObject(
            newAttr.value,
            deeperAssertions,
            currentDepth + 1,
            thisPathIsOptional
          );
          narrowedValue !== newAttr.value && (newAttr = createObjectAttribute(narrowedValue), hasChanges = !0);
        } else if (newAttr.value.type === "union") {
          const originalOf = newAttr.value.of, narrowedOf = originalOf.map((t) => t.type === "object" ? applyAssertionsToObject(
            t,
            deeperAssertions,
            currentDepth + 1,
            thisPathIsOptional
          ) : t), nonNullTypes = narrowedOf.filter((t) => t.type !== "null");
          thisPathIsOptional && nonNullTypes.length !== narrowedOf.length ? (newAttr = createObjectAttribute(unionOf(...nonNullTypes)), hasChanges = !0) : narrowedOf.some((t, i) => t !== originalOf[i]) && (newAttr = createObjectAttribute(unionOf(...narrowedOf)), hasChanges = !0);
        }
      }
      shouldRemoveAttr || (narrowedAttributes[name] = newAttr);
    } else
      narrowedAttributes[name] = attr;
  }
  return hasChanges ? {
    ...node,
    attributes: narrowedAttributes
  } : node;
}
function narrowNode(node, assertions) {
  return assertions.length === 0 ? node : node.type === "object" ? applyAssertionsToObject(node, assertions) : node.type === "union" ? unionOf(...node.of.map((n) => narrowNode(n, assertions))) : node;
}
const $trace$1 = debug__default.default("typeEvaluator:scope:trace");
$trace$1.log = console.log.bind(console);
class Context {
  schema;
  constructor(schema) {
    this.schema = schema;
  }
  lookupRef(refTo) {
    for (const val of this.schema)
      if (val.type === "document" && val.name === refTo)
        return {
          type: "object",
          attributes: val.attributes
        };
    return { type: "null" };
  }
  lookupTypeDeclaration(alias) {
    for (const val of this.schema)
      if (val.type === "type" && val.name === alias.name)
        return val.value;
    return { type: "null" };
  }
}
class Scope {
  value;
  parent;
  context;
  isHidden;
  constructor(value, parent, context) {
    this.value = { type: "union", of: value }, this.parent = parent, this.context = context || parent?.context || new Context([]), this.isHidden = !1;
  }
  createNested(value) {
    return this.isHidden ? new Scope(value, this.parent, this.context) : new Scope(value, this, this.context);
  }
  createHidden(value) {
    const result = this.createNested(value);
    return result.isHidden = !0, result;
  }
}
const $trace = debug__default.default("typeEvaluator:evaluate:trace");
$trace.log = console.log.bind(console);
const $debug = debug__default.default("typeEvaluator:evaluate:debug");
$debug.log = console.log.bind(console);
const $warn = debug__default.default("typeEvaluator:evaluate:warn");
function typeEvaluate(ast, schema) {
  $debug("evaluateQueryType.ast %O", ast), $debug("evaluateQueryType.schema %O", schema);
  const parsed = walk({
    node: ast,
    scope: new Scope([], void 0, new Context(schema))
  });
  $trace("evaluateQueryType.parsed %O", parsed);
  const optimized = optimizeUnions(parsed);
  return $debug("evaluateQueryType.optimized %O", optimized), optimized;
}
function mapDeref(node, scope) {
  return mapNode(node, scope, (base) => {
    if (base.type === "array")
      return {
        type: "array",
        of: mapDeref(base.of, scope)
      };
    if (base.type === "object") {
      if (base.dereferencesTo !== void 0)
        return scope.context.lookupRef(base.dereferencesTo);
      if (base.rest !== void 0)
        return mapDeref(resolveInline(base.rest, scope), scope);
    }
    return { type: "null" };
  });
}
function handleDerefNode(node, scope) {
  $trace("deref.node %O", node);
  const derefedNode = mapDeref(walk({ node: node.base, scope }), scope);
  return $trace("deref.derefedNode %O", derefedNode), derefedNode;
}
function handleObjectSplatNode(attr, scope) {
  const value = walk({ node: attr.value, scope });
  return $trace("object.splat.value %O", value), mapNode(value, scope, (node) => {
    if (node.type === "unknown")
      return { type: "unknown" };
    if (node.type !== "object")
      return { type: "object", attributes: {} };
    const attributes = {};
    for (const name in node.attributes)
      node.attributes.hasOwnProperty(name) && (attributes[name] = node.attributes[name]);
    if (node.rest !== void 0) {
      const resolvedRest = resolveInline(node.rest, scope);
      if (resolvedRest.type === "unknown")
        return { type: "unknown" };
      if (resolvedRest.type !== "object")
        return { type: "null" };
      for (const name in resolvedRest.attributes)
        resolvedRest.attributes.hasOwnProperty(name) && (attributes[name] = resolvedRest.attributes[name]);
    }
    return { type: "object", attributes };
  });
}
function handleObjectNode(node, scope) {
  if ($trace("object.node %O", node), node.attributes.length === 0)
    return {
      type: "object",
      attributes: {}
    };
  const objectAttributes = [], splatVariants = [], conditionalVariants = [];
  for (const [idx, attr] of node.attributes.entries()) {
    if (attr.type === "ObjectAttributeValue") {
      const attributeNode = walk({ node: attr.value, scope });
      objectAttributes.push([
        idx,
        attr.name,
        {
          type: "objectAttribute",
          value: attributeNode
        }
      ]);
      continue;
    }
    if (attr.type === "ObjectSplat") {
      const attributeNode = handleObjectSplatNode(attr, scope);
      switch ($trace("object.splat.result %O", attributeNode), attributeNode.type) {
        case "object": {
          splatVariants.push([idx, attributeNode]);
          continue;
        }
        case "union": {
          for (const node2 of attributeNode.of)
            if (node2.type === "unknown")
              return node2;
          splatVariants.push([idx, attributeNode]);
          continue;
        }
        default:
          return { type: "unknown" };
      }
    }
    if (attr.type === "ObjectConditionalSplat") {
      const condition = booleanValue(walk({ node: attr.condition, scope }), scope);
      if ($trace("object.conditional.splat.condition %O", condition), condition.canBeTrue === !1)
        continue;
      const attributeNode = handleObjectSplatNode(attr, scope);
      if ($trace("object.conditional.splat.result %O", attributeNode), condition.canBeFalse === !1 && condition.canBeNull === !1)
        switch (attributeNode.type) {
          case "object": {
            splatVariants.push([idx, attributeNode]);
            continue;
          }
          case "union": {
            for (const node2 of attributeNode.of)
              if (node2.type !== "object")
                return { type: "unknown" };
            splatVariants.push([idx, attributeNode]);
            continue;
          }
          default:
            return { type: "unknown" };
        }
      const variant = mapNode(attributeNode, scope, (attributeNode2) => ($trace("object.conditional.splat.result.concrete %O", attributeNode2), attributeNode2.type !== "object" ? { type: "unknown" } : {
        type: "object",
        attributes: attributeNode2.attributes
      }));
      if (variant.type === "union") {
        for (const node2 of variant.of)
          if (node2.type !== "object")
            return { type: "unknown" };
        variant.of.push({ type: "object", attributes: {} }), conditionalVariants.push([idx, variant]);
        continue;
      }
      if (variant.type !== "object")
        return { type: "unknown" };
      conditionalVariants.push([
        idx,
        {
          type: "union",
          of: [{ type: "object", attributes: {} }, variant]
        }
      ]);
      continue;
    }
    throw new Error(`Unknown object attribute type: ${attr.type}`);
  }
  const guaranteedAttributes = [];
  guaranteedAttributes.push(...objectAttributes);
  for (const [idx, splatNode] of splatVariants) {
    if (splatNode.type === "object") {
      for (const name in splatNode.attributes) {
        if (!splatNode.attributes.hasOwnProperty(name))
          continue;
        const attribute = splatNode.attributes[name];
        guaranteedAttributes.push([idx, name, attribute]);
      }
      continue;
    }
    conditionalVariants.push([idx, splatNode]);
  }
  if (guaranteedAttributes.sort(([a], [b]) => a - b), conditionalVariants.length === 0)
    return {
      type: "object",
      attributes: Object.fromEntries(
        guaranteedAttributes.map(([, name, attribute]) => [name, attribute])
      )
    };
  const matrix = [];
  for (const [unionIdx, union] of conditionalVariants) {
    const unionGuaranteedBefore = [], unionGuaranteedAfter = [];
    for (const [guaranteedIndex, name, attribute] of guaranteedAttributes)
      guaranteedIndex < unionIdx && unionGuaranteedBefore.push([guaranteedIndex, name, attribute]), guaranteedIndex > unionIdx && unionGuaranteedAfter.push([guaranteedIndex, name, attribute]);
    const allVariantsAttributes = [];
    for (const [conditionalVariantIdx, otherUnion] of conditionalVariants) {
      const variantAttributes = [];
      for (const node2 of otherUnion.of)
        variantAttributes.push(node2.attributes);
      allVariantsAttributes.push([conditionalVariantIdx, variantAttributes]);
    }
    for (const node2 of union.of) {
      matrix.push({
        type: "object",
        attributes: {
          ...Object.fromEntries(
            unionGuaranteedBefore.map(([, name, attribute]) => [name, attribute])
          ),
          ...node2.attributes,
          ...Object.fromEntries(
            unionGuaranteedAfter.map(([, name, attribute]) => [name, attribute])
          )
        }
      });
      for (const [outerIdx, outerAttributes] of allVariantsAttributes)
        for (const outer of outerAttributes)
          for (const [innerIdx, innerAttributes] of allVariantsAttributes)
            if (outerIdx !== innerIdx)
              for (const inner of innerAttributes) {
                const _before = [...unionGuaranteedBefore], _after = [...unionGuaranteedAfter];
                for (const name in outer)
                  outer.hasOwnProperty(name) && outerIdx !== unionIdx && (outerIdx < unionIdx && _before.push([outerIdx, name, outer[name]]), outerIdx > unionIdx && _after.push([outerIdx, name, outer[name]]));
                for (const name in inner)
                  inner.hasOwnProperty(name) && outerIdx !== unionIdx && (innerIdx < unionIdx && _before.push([innerIdx, name, inner[name]]), innerIdx > unionIdx && _after.push([innerIdx, name, inner[name]]));
                _before.sort(([a], [b]) => a - b), _after.sort(([a], [b]) => a - b);
                const before = Object.fromEntries(
                  _before.map(([, name, attribute]) => [name, attribute])
                ), after = Object.fromEntries(
                  _after.map(([, name, attribute]) => [name, attribute])
                );
                matrix.push({
                  type: "object",
                  attributes: {
                    ...before,
                    ...node2.attributes,
                    ...after
                  }
                });
              }
    }
  }
  return optimizeUnions({
    type: "union",
    of: matrix
  });
}
function handleOpCallNode(node, scope) {
  $trace("opcall.node %O", node);
  const lhs = walk({ node: node.left, scope }), rhs = walk({ node: node.right, scope });
  return mapNode(
    lhs,
    scope,
    (left) => (
      // eslint-disable-next-line complexity, max-statements
      mapNode(rhs, scope, (right) => {
        switch ($trace('opcall.node.concrete "%s" %O', node.op, { left, right }), node.op) {
          case "==":
            return left.type === "unknown" || right.type === "unknown" ? { type: "boolean" } : left.type !== right.type ? {
              type: "boolean",
              value: !1
            } : left.type === "null" ? {
              type: "boolean",
              value: !0
            } : !isPrimitiveTypeNode(left) || !isPrimitiveTypeNode(right) ? {
              type: "boolean",
              value: !1
            } : {
              type: "boolean",
              value: evaluateComparison(node.op, left, right)
            };
          case "!=": {
            if (left.type === "unknown" || right.type === "unknown")
              return { type: "boolean" };
            if (left.type !== right.type)
              return {
                type: "boolean",
                value: !0
              };
            if (left.type === "null")
              return {
                type: "boolean",
                value: !1
              };
            if (!isPrimitiveTypeNode(left) || !isPrimitiveTypeNode(right))
              return {
                type: "boolean",
                value: !0
              };
            let value = evaluateComparison("==", left, right);
            return value !== void 0 && (value = !value), {
              type: "boolean",
              value
            };
          }
          case ">":
          case ">=":
          case "<":
          case "<=":
            return left.type === "unknown" || right.type === "unknown" ? nullUnion({ type: "boolean" }) : left.type !== right.type ? { type: "null" } : left.type === "string" && right.type === "string" && isDateTime(left) !== isDateTime(right) ? { type: "null" } : !isPrimitiveTypeNode(left) || !isPrimitiveTypeNode(right) ? { type: "null" } : {
              type: "boolean",
              value: evaluateComparison(node.op, left, right)
            };
          case "in":
            return left.type === "unknown" || right.type === "unknown" ? nullUnion({ type: "boolean" }) : right.type !== "array" ? isFuncCall(node.right, "global::path") ? { type: "boolean" } : { type: "null" } : !isPrimitiveTypeNode(left) && left.type !== "null" ? {
              type: "boolean",
              value: !1
            } : mapNode(right.of, scope, (arrayTypeNode) => arrayTypeNode.type === "unknown" ? nullUnion({ type: "boolean" }) : left.type === "null" ? {
              type: "boolean",
              value: arrayTypeNode.type === "null"
            } : left.value === void 0 ? {
              type: "boolean"
            } : isPrimitiveTypeNode(arrayTypeNode) ? arrayTypeNode.value === void 0 ? {
              type: "boolean"
            } : {
              type: "boolean",
              value: left.value === arrayTypeNode.value
            } : {
              type: "boolean",
              value: !1
            });
          case "match":
            return left.type === "unknown" || right.type === "unknown" ? { type: "boolean" } : containsDateTime(left) || containsDateTime(right) ? { type: "boolean", value: !1 } : {
              type: "boolean",
              value: match(left, right)
            };
          case "+":
            return left.type === "unknown" || right.type === "unknown" ? { type: "unknown" } : isDateTime(left) && right.type === "number" || left.type === "number" && isDateTime(right) ? dateTimeString() : isString(left) && isString(right) ? {
              type: "string",
              value: left.value !== void 0 && right.value !== void 0 ? left.value + right.value : void 0
            } : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value + right.value : void 0
            } : left.type === "array" && right.type === "array" ? {
              type: "array",
              of: {
                type: "union",
                of: [left.of, right.of]
              }
            } : left.type === "object" && right.type === "object" ? {
              type: "object",
              attributes: { ...left.attributes, ...right.attributes }
            } : { type: "null" };
          case "-":
            return isDateTime(left) && isDateTime(right) ? { type: "number" } : isDateTime(left) && right.type === "unknown" ? nullUnion({
              type: "union",
              of: [{ type: "number" }, dateTimeString()]
            }) : isDateTime(left) && right.type === "number" ? dateTimeString() : left.type === "unknown" ? nullUnion({
              type: "union",
              of: [{ type: "number" }, dateTimeString()]
            }) : right.type === "unknown" ? nullUnion({ type: "number" }) : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value - right.value : void 0
            } : { type: "null" };
          case "*":
            return left.type === "unknown" || right.type === "unknown" ? nullUnion({ type: "number" }) : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value * right.value : void 0
            } : { type: "null" };
          case "/":
            return left.type === "unknown" || right.type === "unknown" ? nullUnion({ type: "number" }) : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value / right.value : void 0
            } : { type: "null" };
          case "**":
            return left.type === "unknown" || right.type === "unknown" ? nullUnion({ type: "number" }) : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value ** right.value : void 0
            } : { type: "null" };
          case "%":
            return left.type === "unknown" || right.type === "unknown" ? nullUnion({ type: "number" }) : left.type === "number" && right.type === "number" ? {
              type: "number",
              value: left.value !== void 0 && right.value !== void 0 ? left.value % right.value : void 0
            } : { type: "null" };
          default:
            return {
              type: "unknown"
            };
        }
      })
    )
  );
}
function handleSelectNode(node, scope) {
  const values = [];
  let guaranteed = !1;
  for (const alternative of node.alternatives) {
    const conditionValue = walk({ node: alternative.condition, scope }), conditionScope = resolveFilter(alternative.condition, scope);
    conditionScope.type === "union" && conditionScope.of.length > 0 && values.push(walk({ node: alternative.value, scope: scope.createHidden(conditionScope.of) })), conditionValue.type === "boolean" && conditionValue.value === !0 && (guaranteed = !0);
  }
  return node.fallback && !guaranteed && values.push(walk({ node: node.fallback, scope })), values.length === 0 ? { type: "null" } : {
    type: "union",
    of: values
  };
}
function handleArrayCoerceNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("arrayCoerce.base %O", base), mapArray(base, scope, (base2) => base2);
}
function handleFlatMap(node, scope) {
  const base = walk({ node: node.base, scope });
  return mapArray(base, scope, (base2) => {
    const inner = walk({ node: node.expr, scope: scope.createHidden([base2.of]) });
    return mapNode(
      inner,
      scope,
      (inner2) => inner2.type === "array" ? inner2 : { type: "array", of: inner2 },
      (nodes) => {
        const inner2 = [];
        for (const node2 of nodes) {
          if (node2.type === "unknown") return { type: "array", of: node2 };
          if (node2.type !== "array") throw new Error(`Unexpected type: ${node2.type}`);
          inner2.push(node2.of);
        }
        return {
          type: "array",
          of: optimizeUnions({ type: "union", of: inner2 })
        };
      }
    );
  });
}
function handleMap(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("map.base %O", base), mapArray(base, scope, (base2) => ({
    type: "array",
    of: walk({ node: node.expr, scope: scope.createHidden([base2.of]) })
  }));
}
function handleProjectionNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("projection.base %O", base), mapObject(
    base,
    scope,
    (base2) => walk({ node: node.expr, scope: scope.createNested([base2]) })
  );
}
function createFilterScope(base, scope) {
  return base.type === "array" ? base.of.type === "union" ? scope.createNested(base.of.of) : scope.createNested([base.of]) : scope.createNested([base]);
}
function handleFilterNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("filter.base %O", base), mapNode(base, scope, (base2) => {
    if ($trace("filter.resolving %O", base2), base2.type === "null")
      return base2;
    const resolved = resolveFilter(node.expr, createFilterScope(base2, scope));
    return $trace("filter.resolved %O", resolved), {
      type: "array",
      of: resolved
    };
  });
}
function handleAccessAttributeNode(node, scope) {
  let attributeBase = scope.value;
  return node.base && (attributeBase = walk({ node: node.base, scope })), $trace("accessAttribute.base %s %O", node.name, attributeBase), handleAccessAttributeBase(attributeBase, node.name, scope);
}
function handleAccessAttributeBase(base, name, scope) {
  return mapObject(base, scope, (base2) => {
    $trace('Looking for attribute "%s" in object %O', name, base2);
    const attribute = base2.attributes[name];
    return attribute !== void 0 ? ($debug(`accessAttribute.attribute found ${name} %O`, attribute), attribute.optional ? nullUnion(attribute.value) : attribute.value) : base2.rest ? handleAccessAttributeBase(base2.rest, name, scope) : ($warn(`attribute "${name}" not found in object`), { type: "null" });
  });
}
function handleAccessElementNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return $trace("accessElement.base %O", base), mapArray(base, scope, (base2) => nullUnion(base2.of));
}
function handleArrayNode(node, scope) {
  const of = [];
  for (const el of node.elements) {
    const node2 = walk({ node: el.value, scope });
    if (el.isSplat) {
      if (node2.type !== "array")
        continue;
      of.push(node2.of);
    } else
      of.push(node2);
  }
  return {
    type: "array",
    of: {
      type: "union",
      of
    }
  };
}
function handleValueNode(node, scope) {
  if (node.value === null)
    return { type: "null" };
  switch (typeof node.value) {
    case "string":
      return {
        type: "string",
        value: node.value
      };
    case "number":
      return {
        type: "number",
        value: node.value
      };
    case "boolean":
      return {
        type: "boolean",
        value: node.value
      };
    case "object":
      return node.value === null ? { type: "null" } : Array.isArray(node.value) ? {
        type: "array",
        of: {
          type: "union",
          of: node.value.map((value) => walk({ node: { type: "Value", value }, scope }))
        }
      } : {
        type: "object",
        attributes: Object.fromEntries(
          Object.entries(node.value).map(([key, value]) => [
            key,
            {
              type: "objectAttribute",
              value: walk({ node: { type: "Value", value }, scope })
            }
          ])
        )
      };
    default:
      return { type: "unknown" };
  }
}
function handleSlice(node, scope) {
  $trace("slice.node %O", node);
  const base = walk({ node: node.base, scope });
  return mapArray(base, scope, (base2) => base2);
}
function handleParentNode({ n }, scope) {
  $trace("handle.parent.currentScope %d %O", n, scope);
  let current = scope;
  for (let i = 0; i < n; i++) {
    for (; current?.isHidden; )
      current = current.parent;
    current = current?.parent;
  }
  return $trace("handle.parent.newScope %d %O", n, current), current ? current.value.of.length === 0 ? { type: "null" } : current.value : { type: "null" };
}
function handleNotNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return mapNode(base, scope, (base2) => base2.type === "unknown" ? nullUnion({ type: "boolean" }) : base2.type === "boolean" ? base2.value !== void 0 ? { type: "boolean", value: base2.value === !1 } : { type: "boolean" } : { type: "null" });
}
function handleNegNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return mapNode(base, scope, (base2) => base2.type === "unknown" ? nullUnion({ type: "number" }) : base2.type !== "number" ? { type: "null" } : base2.value !== void 0 ? { type: "number", value: -base2.value } : base2);
}
function handlePosNode(node, scope) {
  const base = walk({ node: node.base, scope });
  return mapNode(base, scope, (base2) => base2.type === "unknown" ? nullUnion({ type: "number" }) : base2.type !== "number" ? { type: "null" } : base2);
}
function handleEverythingNode(_, scope) {
  return {
    type: "array",
    of: {
      type: "union",
      of: scope.context.schema.filter((obj) => obj.type === "document").map((doc) => ({
        type: "object",
        attributes: doc.attributes
      }))
    }
  };
}
function handleAndNode(node, scope) {
  const left = walk({ node: node.left, scope }), right = walk({ node: node.right, scope });
  return mapNode(
    left,
    scope,
    (lhs) => mapNode(right, scope, (rhs) => {
      const value = booleanAnd(booleanValue(lhs, scope), booleanValue(rhs, scope));
      return booleanInterpretationToTypeNode(value);
    })
  );
}
function handleOrNode(node, scope) {
  const left = walk({ node: node.left, scope }), right = walk({ node: node.right, scope });
  return mapNode(
    left,
    scope,
    (lhs) => mapNode(right, scope, (rhs) => {
      const value = booleanOr(booleanValue(lhs, scope), booleanValue(rhs, scope));
      return booleanInterpretationToTypeNode(value);
    })
  );
}
const OVERRIDE_TYPE_SYMBOL = /* @__PURE__ */ Symbol("groq-js.type");
function walk({ node, scope }) {
  if (OVERRIDE_TYPE_SYMBOL in node)
    return node[OVERRIDE_TYPE_SYMBOL];
  switch (node.type) {
    // Filtering, traversal & projections
    case "Map":
      return handleMap(node, scope);
    case "Projection":
      return handleProjectionNode(node, scope);
    case "Filter":
      return handleFilterNode(node, scope);
    case "AccessAttribute":
      return optimizeUnions(handleAccessAttributeNode(node, scope));
    case "AccessElement":
      return handleAccessElementNode(node, scope);
    case "ArrayCoerce":
      return handleArrayCoerceNode(node, scope);
    case "FlatMap":
      return handleFlatMap(node, scope);
    // Operations
    case "OpCall":
      return handleOpCallNode(node, scope);
    case "And":
      return handleAndNode(node, scope);
    case "Or":
      return handleOrNode(node, scope);
    case "Select":
      return handleSelectNode(node, scope);
    case "PipeFuncCall":
      return walk({ node: node.base, scope });
    // Values
    case "Deref":
      return handleDerefNode(node, scope);
    case "Object":
      return handleObjectNode(node, scope);
    case "Value":
      return handleValueNode(node, scope);
    case "Array":
      return handleArrayNode(node, scope);
    // Special cases
    case "Everything":
      return handleEverythingNode(node, scope);
    case "This":
      return $trace("this %O", scope.value), scope.value;
    case "Parent":
      return handleParentNode(node, scope);
    case "FuncCall":
      return handleFuncCallNode(node, scope);
    case "Group":
      return walk({ node: node.base, scope });
    case "Not":
      return handleNotNode(node, scope);
    case "Parameter":
      return {
        type: "unknown"
      };
    case "Slice":
      return handleSlice(node, scope);
    case "Neg":
      return handleNegNode(node, scope);
    case "Pos":
      return handlePosNode(node, scope);
    // everything else
    case "Asc":
    case "Desc":
    case "Context":
    case "Tuple":
    case "SelectorFuncCall":
    case "SelectorNested":
    case "InRange":
      return { type: "unknown" };
    default:
      throw new Error(`unknown node type ${node.type}`);
  }
}
function isPrimitiveTypeNode(node) {
  return node.type === "string" || node.type === "number" || node.type === "boolean";
}
function evaluateComparison(opcall, left, right) {
  if (!(left.value === void 0 || right.value === void 0))
    switch (opcall) {
      case "==":
        return left.value === right.value;
      case "<":
        return left.value < right.value;
      case "<=":
        return left.value <= right.value;
      case ">":
        return left.value > right.value;
      case ">=":
        return left.value >= right.value;
      default:
        throw new Error(`unknown comparison operator ${opcall}`);
    }
}
function resolveFilter(expr, scope) {
  $trace("resolveFilter.expr %O", expr);
  const filtered = [], assertions = extractNarrowingAssertions(expr);
  for (const node of scope.value.of) {
    const subScope = scope.createHidden([node]), cond = walk({ node: expr, scope: subScope }), boolResult = booleanValue(cond, subScope);
    if (boolResult.canBeTrue)
      if (boolResult.canBeFalse && assertions.length > 0) {
        const narrowedNode = narrowNode(node, assertions), narrowedScope = scope.createHidden([narrowedNode]), narrowedCond = walk({ node: expr, scope: narrowedScope }), narrowedBoolResult = booleanValue(narrowedCond, narrowedScope);
        narrowedBoolResult.canBeTrue && !narrowedBoolResult.canBeFalse ? filtered.push(narrowedNode) : filtered.push(node);
      } else
        filtered.push(node);
  }
  return $trace(
    `resolveFilter ${expr.type === "OpCall" ? `${expr.type}/${expr.op}` : expr.type} %O`,
    filtered
  ), { type: "union", of: filtered };
}
function mapArray(node, scope, mapper) {
  return mapNode(node, scope, (base) => base.type === "unknown" ? base : base.type === "array" ? mapper(base) : { type: "null" });
}
function mapObject(node, scope, mapper) {
  return mapNode(node, scope, (base) => base.type === "unknown" ? base : base.type === "object" ? mapper(base) : { type: "null" });
}
exports.evaluate = evaluator.evaluateQuery;
exports.evaluateSync = evaluator.evaluateQuerySync;
exports.DateTime = shared.DateTime;
exports.Path = shared.Path;
exports.isSelectorNested = shared.isSelectorNested;
exports.isSelectorNode = shared.isSelectorNode;
exports.toJS = shared.toJS;
exports.unparse = experimental.unparse;
exports.GroqSyntaxError = GroqSyntaxError;
exports.createReferenceTypeNode = createReferenceTypeNode;
exports.parse = parse;
exports.typeEvaluate = typeEvaluate;
//# sourceMappingURL=1.js.map

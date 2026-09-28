import { jsx } from "react/jsx-runtime";
import { refractor } from "refractor/core";
import { filter } from "unist-util-filter";
import { visitParents } from "unist-util-visit-parents";
import { createElement } from "react";
var __defProp$2 = Object.defineProperty, __defProps$2 = Object.defineProperties, __getOwnPropDescs$2 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$2 = Object.getOwnPropertySymbols, __hasOwnProp$2 = Object.prototype.hasOwnProperty, __propIsEnum$2 = Object.prototype.propertyIsEnumerable, __defNormalProp$2 = (obj, key, value) => key in obj ? __defProp$2(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$2 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$2.call(b, prop) && __defNormalProp$2(a, prop, b[prop]);
  if (__getOwnPropSymbols$2)
    for (var prop of __getOwnPropSymbols$2(b))
      __propIsEnum$2.call(b, prop) && __defNormalProp$2(a, prop, b[prop]);
  return a;
}, __spreadProps$2 = (a, b) => __defProps$2(a, __getOwnPropDescs$2(b));
function addMarkers(ast, options) {
  const markers = options.markers.map((marker) => typeof marker == "number" ? { line: marker } : marker).sort((nodeA, nodeB) => nodeA.line - nodeB.line), numbered = lineNumberify(ast.children).nodes;
  return markers.length === 0 || numbered.length === 0 ? __spreadProps$2(__spreadValues$2({}, ast), { children: numbered }) : wrapLines(numbered, markers, options);
}
function lineNumberify(ast, context = { lineNumber: 1 }) {
  const resultNodes = [];
  return ast.reduce(
    (result, node) => {
      if (node.type === "doctype")
        return result;
      const lineStart = context.lineNumber;
      if (node.type === "text") {
        if (node.value.indexOf(`
`) === -1)
          return setLineInfo(node, lineStart, lineStart), result.nodes.push(node), result;
        const lines = node.value.split(`
`);
        for (let i = 0; i < lines.length; i++) {
          const lineNum = i === 0 ? context.lineNumber : ++context.lineNumber, text = {
            type: "text",
            value: i === lines.length - 1 ? lines[i] : `${lines[i]}
`
          }, withLineInfo = setLineInfo(text, lineNum, lineNum);
          result.nodes.push(withLineInfo);
        }
        return result.lineNumber = context.lineNumber, result;
      }
      if (node.type === "element" && node.children) {
        const processed = lineNumberify(node.children, context), firstChild = processed.nodes.find(isElementOrText), lastChild = processed.nodes.findLast(isElementOrText);
        return setLineInfo(
          node,
          firstChild ? getLineStart(firstChild, lineStart) : lineStart,
          lastChild ? getLineEnd(lastChild, lineStart) : lineStart
        ), node.children = processed.nodes, result.lineNumber = processed.lineNumber, result.nodes.push(node), result;
      }
      return result.nodes.push(node), result;
    },
    { nodes: resultNodes, lineNumber: context.lineNumber }
  );
}
function isElementOrText(node) {
  return node.type === "element" || node.type === "text";
}
function getLineStart(node, fallbackLineStart = 1) {
  return node.data && typeof node.data.lineStart == "number" ? node.data.lineStart : fallbackLineStart;
}
function getLineEnd(node, fallbackLineEnd = 1) {
  return node.data && typeof node.data.lineEnd == "number" ? node.data.lineEnd : fallbackLineEnd;
}
function setLineInfo(node, lineStart, lineEnd) {
  return node.data || (node.data = {}), node.data.lineStart = lineStart, node.data.lineEnd = lineEnd, node;
}
function unwrapLine(markerLine, nodes) {
  const tree = { type: "root", children: nodes }, headMap = /* @__PURE__ */ new WeakMap(), lineMap = /* @__PURE__ */ new WeakMap(), tailMap = /* @__PURE__ */ new WeakMap(), cloned = [];
  function addCopy(map, node, ancestors) {
    cloned.push(node), ancestors.forEach((ancestor) => {
      map.has(ancestor) || (map.set(ancestor, Object.assign({}, ancestor, { children: [] })), ancestor !== tree && cloned.push(ancestor));
    });
    let i = ancestors.length;
    for (; i--; ) {
      const ancestor = map.get(ancestors[i]);
      if (!ancestor || !("children" in ancestor))
        continue;
      const child = ancestors[i + 1], leaf = map.get(child) || node;
      ancestor.children.indexOf(leaf) === -1 && ancestor.children.push(leaf);
    }
  }
  visitParents(tree, (node, ancestors) => {
    if (!("children" in node || !isElementOrText(node))) {
      if (getLineStart(node) < markerLine) {
        addCopy(headMap, node, ancestors);
        return;
      }
      if (getLineStart(node) === markerLine) {
        addCopy(lineMap, node, ancestors);
        return;
      }
      getLineEnd(node) > markerLine && cloned.some((clone) => ancestors.includes(clone)) && addCopy(tailMap, node, ancestors);
    }
  });
  const filtered = filter(tree, (node) => cloned.indexOf(node) === -1), getChildren = (map) => {
    const rootNode = map.get(tree);
    return rootNode ? (visitParents(rootNode, (leaf, ancestors) => {
      if (isElementOrText(leaf) && "children" in leaf) {
        setLineInfo(leaf, 0, 0);
        return;
      }
      ancestors.forEach((ancestor) => {
        setLineInfo(
          ancestor,
          Math.max(getLineStart(ancestor), getLineStart(leaf)),
          Math.max(getLineEnd(ancestor), getLineEnd(leaf))
        );
      });
    }), rootNode.children) : [];
  };
  return [
    ...getChildren(headMap),
    ...getChildren(lineMap),
    ...getChildren(tailMap),
    ...filtered ? filtered.children : []
  ];
}
function wrapBatch(children, marker, options) {
  const className = marker.className || "refractor-marker", baseData = {
    lineStart: marker.line,
    lineEnd: getLineEnd(children[children.length - 1]),
    isMarker: !0
  };
  return {
    type: "element",
    tagName: "div",
    data: marker.component ? __spreadProps$2(__spreadValues$2({}, baseData), { component: marker.component, markerProperties: options }) : baseData,
    properties: { className },
    children
  };
}
function wrapLines(treeNodes, markers, options) {
  const ast = markers.reduce(
    (acc, marker) => unwrapLine(marker.line, acc),
    treeNodes
  ), wrapped = [];
  let astIndex = 0;
  for (let m = 0; m < markers.length; m++) {
    const marker = markers[m];
    for (let node = ast[astIndex]; node && getLineEnd(node) < marker.line; node = ast[++astIndex])
      wrapped.push(node);
    const batch = [];
    for (let node = ast[astIndex]; node && getLineEnd(node) === marker.line; node = ast[++astIndex])
      node.type !== "doctype" && batch.push(node);
    batch.length > 0 && wrapped.push(wrapBatch(batch, marker, options));
  }
  for (; astIndex < ast.length; )
    wrapped.push(ast[astIndex++]);
  return { type: "root", children: wrapped };
}
var __defProp$1 = Object.defineProperty, __defProps$1 = Object.defineProperties, __getOwnPropDescs$1 = Object.getOwnPropertyDescriptors, __getOwnPropSymbols$1 = Object.getOwnPropertySymbols, __hasOwnProp$1 = Object.prototype.hasOwnProperty, __propIsEnum$1 = Object.prototype.propertyIsEnumerable, __defNormalProp$1 = (obj, key, value) => key in obj ? __defProp$1(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues$1 = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp$1.call(b, prop) && __defNormalProp$1(a, prop, b[prop]);
  if (__getOwnPropSymbols$1)
    for (var prop of __getOwnPropSymbols$1(b))
      __propIsEnum$1.call(b, prop) && __defNormalProp$1(a, prop, b[prop]);
  return a;
}, __spreadProps$1 = (a, b) => __defProps$1(a, __getOwnPropDescs$1(b));
function mapWithDepth(depth) {
  return function(child, i) {
    return mapChild(child, i, depth);
  };
}
function mapChild(child, i, depth) {
  if (child.type === "doctype")
    return null;
  if (!("tagName" in child))
    return child.value;
  let className = "";
  typeof child.properties < "u" && (className = Array.isArray(child.properties.className) ? child.properties.className.join(" ") : `${child.properties.className}`);
  const key = `fract-${depth}-${i}`, children = child.children && child.children.map(mapWithDepth(depth + 1));
  return isReactRefractorMarkerDataWithComponent(child.data) ? createElement(
    child.data.component,
    __spreadProps$1(__spreadValues$1(__spreadValues$1({ key }, child.properties), child.data.markerProperties), { className }),
    children
  ) : createElement(child.tagName, { key, className }, children);
}
function isReactRefractorMarkerDataWithComponent(data) {
  return typeof data == "object" && data !== null && "component" in data && "markerProperties" in data;
}
var __defProp = Object.defineProperty, __defProps = Object.defineProperties, __getOwnPropDescs = Object.getOwnPropertyDescriptors, __getOwnPropSymbols = Object.getOwnPropertySymbols, __hasOwnProp = Object.prototype.hasOwnProperty, __propIsEnum = Object.prototype.propertyIsEnumerable, __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: !0, configurable: !0, writable: !0, value }) : obj[key] = value, __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    __hasOwnProp.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b))
      __propIsEnum.call(b, prop) && __defNormalProp(a, prop, b[prop]);
  return a;
}, __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const DEFAULT_CLASSNAME = "refractor";
function Refractor(props) {
  const className = props.className || DEFAULT_CLASSNAME, langClassName = `language-${props.language}`, codeProps = { className: langClassName }, preClass = [className, langClassName].filter(Boolean).join(" ");
  if (props.inline && (codeProps.style = { display: "inline" }, codeProps.className = className), props.plainText) {
    const code2 = /* @__PURE__ */ jsx("code", __spreadProps(__spreadValues({}, codeProps), { children: props.value }));
    return props.inline ? code2 : /* @__PURE__ */ jsx("pre", { className: preClass, children: code2 });
  }
  let ast = refractor.highlight(props.value, props.language);
  props.markers && props.markers.length > 0 && (ast = addMarkers(ast, { markers: props.markers }));
  const value = ast.children.length === 0 ? props.value : ast.children.map(mapWithDepth(0)), code = /* @__PURE__ */ jsx("code", __spreadProps(__spreadValues({}, codeProps), { children: value }));
  return props.inline ? code : /* @__PURE__ */ jsx("pre", { className: preClass, children: code });
}
const registerLanguage = (lang) => refractor.register(lang), hasLanguage = (lang) => refractor.registered(lang);
export {
  Refractor,
  hasLanguage,
  registerLanguage
};
//# sourceMappingURL=index.js.map

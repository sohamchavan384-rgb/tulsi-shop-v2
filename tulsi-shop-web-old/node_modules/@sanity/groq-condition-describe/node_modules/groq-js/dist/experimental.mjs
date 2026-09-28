const IDENT_RE = /^[a-zA-Z_][a-zA-Z_0-9]*/, isIdent = (s) => IDENT_RE.test(s), json = (v) => JSON.stringify(v), prop = (name) => isIdent(name) ? `.${name}` : `[${json(name)}]`, propWith = (prefix, name) => `${prefix}${isIdent(name) ? `.${name}` : `[${json(name)}]`}`, joinArgs = (args) => args.map(unparse).join(", ");
function unparse(node) {
  switch (node.type) {
    case "AccessAttribute": {
      if (isIdent(node.name))
        return node.base ? `${unparse(node.base)}.${node.name}` : node.name;
      const base = node.base || { type: "This" };
      return `${unparse(base)}[${json(node.name)}]`;
    }
    case "AccessElement":
      return `${unparse(node.base)}[${node.index}]`;
    case "Array":
      return `[${node.elements.map(({ value, isSplat }) => isSplat ? `...${unparse(value)}` : unparse(value)).join(", ")}]`;
    case "ArrayCoerce":
      return `${unparse(node.base)}[]`;
    case "Asc":
      return `${unparse(node.base)} asc`;
    case "Desc":
      return `${unparse(node.base)} desc`;
    case "And":
      return `${unparse(node.left)} && ${unparse(node.right)}`;
    case "Or":
      return `${unparse(node.left)} || ${unparse(node.right)}`;
    case "OpCall":
      return `${unparse(node.left)} ${node.op} ${unparse(node.right)}`;
    case "Filter":
      return `${unparse(node.base)}[${unparse(node.expr)}]`;
    case "Everything":
      return "*";
    case "This":
      return "@";
    case "Value":
      return json(node.value);
    case "PipeFuncCall":
      return `${unparse(node.base)}|${node.name}(${joinArgs(node.args)})`;
    case "FuncCall":
      return `${node.namespace}::${node.name}(${joinArgs(node.args)})`;
    case "Deref":
      return `${unparse(node.base)}->`;
    case "Map":
    case "Projection":
      return `${unparse(node.base)}${unparseMapExpr(node.expr)}`;
    case "FlatMap":
      return `${unparse(node.base)}${unparseFlatMapExpr(node.expr)}`;
    case "Object":
      return `{${node.attributes.map((attr) => {
        switch (attr.type) {
          case "ObjectAttributeValue":
            return `${json(attr.name)}: ${unparse(attr.value)}`;
          case "ObjectConditionalSplat":
            return `${unparse(attr.condition)} => ${unparse(attr.value)}`;
          case "ObjectSplat":
            return `...${unparse(attr.value)}`;
          default:
            throw new Error(`Unknown object attribute type: ${attr.type}`);
        }
      }).join(", ")}}`;
    case "Pos":
      return `+${unparse(node.base)}`;
    case "Neg":
      return `-${unparse(node.base)}`;
    case "Group":
      return `(${unparse(node.base)})`;
    case "Not":
      return `!${unparse(node.base)}`;
    case "InRange":
      return `${unparse(node.base)} in ${unparse(node.left)}${node.isInclusive ? ".." : "..."}${unparse(node.right)}`;
    case "Parent":
      return Array.from({ length: node.n }, () => "^").join(".");
    case "Parameter":
      return `$${node.name}`;
    case "Slice":
      return `${unparse(node.base)}[${node.left}${node.isInclusive ? ".." : "..."}${node.right}]`;
    case "Select": {
      const alts = node.alternatives.map(
        ({ condition, value }) => `${unparse(condition)} => ${unparse(value)}`
      );
      return node.fallback && alts.push(unparse(node.fallback)), `select(${alts.join(", ")})`;
    }
    case "Tuple":
      return `(${node.members.map(unparse).join(", ")})`;
    case "SelectorFuncCall":
      return `${node.name}(${unparse(node.arg)})`;
    case "SelectorNested":
      return `${unparseSelector(node.base)}.(${unparseSelector(node.nested)})`;
    default:
      throw new Error(`TODO: ${node.type}`);
  }
}
function unparseSelector(node) {
  switch (node.type) {
    case "AccessAttribute":
      return node.base ? `${unparseSelector(node.base)}.${node.name}` : node.name;
    case "Group":
      return `(${unparseSelector(node.base)})`;
    case "Tuple":
      return `(${node.members.map(unparseSelector).join(", ")})`;
    case "ArrayCoerce":
      return `${unparseSelector(node.base)}[]`;
    case "Filter":
      return `${unparseSelector(node.base)}[${unparse(node.expr)}]`;
    case "SelectorFuncCall":
      return `${node.name}(${unparse(node.arg)})`;
    case "SelectorNested":
      return `${unparseSelector(node.base)}.(${unparseSelector(node.nested)})`;
    default:
      return unparse(node);
  }
}
function unparseMapExpr(node) {
  if (node.type === "AccessAttribute") {
    if (node.base?.type === "This") return prop(node.name);
    if (node.base?.type === "Deref" && node.base.base?.type === "This")
      return propWith("->", node.name);
    if (node.base?.type === "Deref" && node.base.base?.type === "AccessAttribute") {
      const derefBase = unparseMapExpr(node.base.base);
      return isIdent(node.name) ? `${derefBase}->.${node.name}` : `${derefBase}->[${json(node.name)}]`;
    }
    if (node.base?.type === "AccessAttribute" || node.base?.type === "AccessElement")
      return `${unparseMapExpr(node.base)}${prop(node.name)}`;
  }
  if (node.type === "AccessElement")
    return `${unparseMapExpr(node.base)}[${node.index}]`;
  if (node.type === "Deref" && node.base?.type === "This")
    return "->";
  if (node.type === "ArrayCoerce")
    return `${unparseMapExpr(node.base)}[]`;
  if (node.type === "Filter")
    return `${unparseMapExpr(node.base)}[${unparse(node.expr)}]`;
  if (node.type === "Projection") {
    if (node.base?.type === "This") return unparseMapExpr(node.expr);
    if (node.base?.type === "Deref") {
      if (node.base.base?.type === "This") return `->${unparse(node.expr)}`;
      if (node.base.base?.type === "AccessAttribute")
        return `${unparseMapExpr(node.base.base)}->${unparse(node.expr)}`;
    }
    if (node.base?.type === "Projection")
      return unparseMapExpr(node.base) + unparse(node.expr);
  }
  return node.type === "Map" ? unparseMapExpr(node.expr) : unparse(node);
}
function unparseFlatMapExpr(node) {
  if (node.type === "AccessAttribute") {
    if (node.base?.type === "This") return prop(node.name);
    if (node.base?.type === "Deref") {
      if (node.base.base?.type === "This") return propWith("->", node.name);
      const derefBase = unparseFlatMapExpr(node.base.base);
      return isIdent(node.name) ? `${derefBase}->.${node.name}` : `${derefBase}->[${json(node.name)}]`;
    }
    if (node.base?.type === "AccessAttribute" || node.base?.type === "AccessElement")
      return `${unparseFlatMapExpr(node.base)}${prop(node.name)}`;
  }
  if (node.type === "AccessElement")
    return `${unparseFlatMapExpr(node.base)}[${node.index}]`;
  if (node.type === "ArrayCoerce")
    return `${unparseFlatMapExpr(node.base)}[]`;
  if (node.type === "Slice")
    return `${unparseFlatMapExpr(node.base)}[${node.left}${node.isInclusive ? ".." : "..."}${node.right}]`;
  if (node.type === "Map") {
    const base = unparseFlatMapExpr(node.base), expr = unparseMapExpr(node.expr);
    return `${base}${expr}`;
  }
  if (node.type === "FlatMap") {
    const base = unparseFlatMapExpr(node.base), expr = unparseFlatMapExpr(node.expr);
    return `${base}${expr}`;
  }
  if (node.type === "Projection") {
    if (node.base?.type === "This") return unparse(node.expr);
    if (node.base?.type === "Deref" && node.base.base?.type === "This")
      return `->${unparse(node.expr)}`;
    if (node.base?.type === "Map")
      return `${unparseFlatMapExpr(node.base)}${unparse(node.expr)}`;
  }
  return node.type === "Deref" && node.base?.type === "This" ? "->" : node.type === "Filter" ? `${unparseFlatMapExpr(node.base)}[${unparse(node.expr)}]` : unparse(node);
}
export {
  unparse
};
//# sourceMappingURL=experimental.mjs.map

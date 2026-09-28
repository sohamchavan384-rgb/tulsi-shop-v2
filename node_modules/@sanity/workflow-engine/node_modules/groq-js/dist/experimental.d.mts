declare interface AccessAttributeNode<T = ExprNode> extends BaseNode {
  type: 'AccessAttribute'
  base?: T
  name: string
}

declare interface AccessElementNode extends BaseNode {
  type: 'AccessElement'
  base: ExprNode
  index: number
}

declare interface AndNode extends BaseNode {
  type: 'And'
  left: ExprNode
  right: ExprNode
}

declare interface ArrayCoerceNode<Base = ExprNode> extends BaseNode {
  type: 'ArrayCoerce'
  base: Base
}

declare interface ArrayElementNode extends BaseNode {
  type: 'ArrayElement'
  value: ExprNode
  isSplat: boolean
}

declare interface ArrayNode extends BaseNode {
  type: 'Array'
  elements: ArrayElementNode[]
}

declare interface AscNode extends BaseNode {
  type: 'Asc'
  base: ExprNode
}

/** The base interface for SyntaxNode. */
declare interface BaseNode {
  type: string
}

declare interface ContextNode extends BaseNode {
  type: 'Context'
  key: string
}

declare interface DerefNode extends BaseNode {
  type: 'Deref'
  base: ExprNode
}

declare interface DescNode extends BaseNode {
  type: 'Desc'
  base: ExprNode
}

declare interface EverythingNode extends BaseNode {
  type: 'Everything'
}

/**
 * A node which can be evaluated into a value.
 * @public
 */
declare type ExprNode =
  | AccessAttributeNode
  | AccessElementNode
  | AndNode
  | ArrayNode
  | ArrayCoerceNode
  | AscNode
  | ContextNode
  | DerefNode
  | DescNode
  | EverythingNode
  | FilterNode
  | FlatMapNode
  | FuncCallNode
  | GroupNode
  | InRangeNode
  | MapNode
  | NegNode
  | NotNode
  | ObjectNode
  | OpCallNode
  | OrNode
  | ParameterNode
  | ParentNode_2
  | PipeFuncCallNode
  | PosNode
  | ProjectionNode
  | SelectNode
  | SelectorNode
  | SliceNode
  | ThisNode
  | TupleNode
  | ValueNode

declare interface FilterNode<Base = ExprNode> extends BaseNode {
  type: 'Filter'
  base: Base
  expr: ExprNode
}

declare interface FlatMapNode extends BaseNode {
  type: 'FlatMap'
  base: ExprNode
  expr: ExprNode
}

declare interface FuncCallNode extends BaseNode {
  type: 'FuncCall'
  namespace: string
  name: string
  args: ExprNode[]
}

declare interface GroupNode<Base = ExprNode> extends BaseNode {
  type: 'Group'
  base: Base
}

declare interface InRangeNode extends BaseNode {
  type: 'InRange'
  base: ExprNode
  left: ExprNode
  right: ExprNode
  isInclusive: boolean
}

declare interface MapNode extends BaseNode {
  type: 'Map'
  base: ExprNode
  expr: ExprNode
}

declare interface NegNode extends BaseNode {
  type: 'Neg'
  base: ExprNode
}

declare interface NotNode extends BaseNode {
  type: 'Not'
  base: ExprNode
}

declare type ObjectAttributeNode =
  | ObjectAttributeValueNode
  | ObjectConditionalSplatNode
  | ObjectSplatNode

declare interface ObjectAttributeValueNode extends BaseNode {
  type: 'ObjectAttributeValue'
  name: string
  value: ExprNode
}

declare interface ObjectConditionalSplatNode extends BaseNode {
  type: 'ObjectConditionalSplat'
  condition: ExprNode
  value: ExprNode
}

declare interface ObjectNode extends BaseNode {
  type: 'Object'
  attributes: ObjectAttributeNode[]
}

declare interface ObjectSplatNode extends BaseNode {
  type: 'ObjectSplat'
  value: ExprNode
}

declare type OpCall =
  | '=='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '**'
  | 'in'
  | 'match'

declare interface OpCallNode extends BaseNode {
  type: 'OpCall'
  op: OpCall
  left: ExprNode
  right: ExprNode
}

declare interface OrNode extends BaseNode {
  type: 'Or'
  left: ExprNode
  right: ExprNode
}

declare interface ParameterNode extends BaseNode {
  type: 'Parameter'
  name: string
}

declare interface ParentNode_2 extends BaseNode {
  type: 'Parent'
  n: number
}

declare interface PipeFuncCallNode extends BaseNode {
  type: 'PipeFuncCall'
  base: ExprNode
  name: string
  args: ExprNode[]
}

declare interface PosNode extends BaseNode {
  type: 'Pos'
  base: ExprNode
}

declare interface ProjectionNode extends BaseNode {
  type: 'Projection'
  base: ExprNode
  expr: ExprNode
}

declare interface SelectAlternativeNode extends BaseNode {
  type: 'SelectAlternative'
  condition: ExprNode
  value: ExprNode
}

declare interface SelectNode extends BaseNode {
  type: 'Select'
  alternatives: SelectAlternativeNode[]
  fallback?: ExprNode
}

declare interface SelectorFuncCallNode extends BaseNode {
  type: 'SelectorFuncCall'
  name: 'anywhere'
  arg: ExprNode
}

declare type SelectorNested =
  | AccessAttributeNode<SelectorNode>
  | ArrayCoerceNode<SelectorNode>
  | FilterNode<SelectorNode>
  | GroupNode<SelectorNode>
  | TupleNode<SelectorNode>

declare interface SelectorNestedNode extends BaseNode {
  type: 'SelectorNested'
  base: SelectorNode
  nested: SelectorNested
}

declare type SelectorNode =
  | AccessAttributeNode<SelectorNode>
  | SelectorFuncCallNode
  | GroupNode<SelectorNode>
  | TupleNode<SelectorNode>
  | ArrayCoerceNode<SelectorNode>
  | FilterNode<SelectorNode>
  | SelectorNestedNode

declare interface SliceNode extends BaseNode {
  type: 'Slice'
  base: ExprNode
  left: number
  right: number
  isInclusive: boolean
}

declare interface ThisNode extends BaseNode {
  type: 'This'
}

declare interface TupleNode<Base = ExprNode> extends BaseNode {
  type: 'Tuple'
  members: Array<Base>
}

/**
 * Converts a GROQ AST node back into a GROQ query string.
 *
 * **Limitation**: This function cannot preserve parameter references. When a query
 * is parsed with parameters (e.g., `parse(query, {params: {name: "value"}})`),
 * the parameters are resolved to their values in the AST. Unparsing such a tree
 * will produce literals instead of parameter references (e.g., `"value"` instead
 * of `$name`). This means `parse(unparse(tree))` will produce a different AST
 * when the original tree contained resolved parameters.
 */
export declare function unparse(node: ExprNode): string

declare interface ValueNode<P = any> {
  type: 'Value'
  value: P
}

export {}

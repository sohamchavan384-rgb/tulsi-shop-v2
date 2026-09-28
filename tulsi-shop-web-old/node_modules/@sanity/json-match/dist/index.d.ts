/**
 * Represents a boolean literal in the JSONMatch AST.
 *
 * @public
 */
export declare type BooleanNode = {
  type: 'Boolean'
  value: boolean
}

/**
 * Represents a comparison operation for filtering array/object elements.
 *
 * @public
 */
export declare type ComparisonNode = {
  type: 'Comparison'
  left: ExprNode
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  right: ExprNode
}

/**
 * Represents an existence check (?) for filtering elements that have a specific property.
 *
 * @public
 */
export declare type ExistenceNode = {
  type: 'Existence'
  base: PathNode
}

/**
 * The root type for all JSONMatch expression nodes.
 *
 * @public
 */
export declare type ExprNode = NumberNode | StringNode | BooleanNode | NullNode | PathNode

/**
 * Finds the array index for an object with a specific `_key` property.
 *
 * This function is optimized for Sanity's keyed arrays where objects have a special
 * `_key` property for stable references. It uses caching for performance when called
 * multiple times on the same array.
 *
 * @param input - The array to search in
 * @param key - The `_key` value to find
 * @returns The index of the object with the matching `_key`, or `undefined` if not found
 *
 * @example
 * Basic usage:
 * ```typescript
 * const items = [
 *   { _key: 'item1', name: 'First' },
 *   { _key: 'item2', name: 'Second' },
 *   { _key: 'item3', name: 'Third' }
 * ]
 *
 * const index = getIndexForKey(items, 'item2')
 * console.log(index) // 1
 * console.log(items[index]) // { _key: 'item2', name: 'Second' }
 * ```
 *
 * @example
 * Handling missing keys:
 * ```typescript
 * const index = getIndexForKey(items, 'nonexistent')
 * console.log(index) // undefined
 * ```
 *
 * @example
 * Performance with caching:
 * ```typescript
 * // First call builds cache
 * const index1 = getIndexForKey(largeArray, 'key1') // Slower
 * // Subsequent calls use cache
 * const index2 = getIndexForKey(largeArray, 'key2') // Faster
 * ```
 *
 * @public
 */
export declare function getIndexForKey(input: unknown, key: string): number | undefined

/**
 * Calculates the depth of a path, which is the number of segments.
 *
 * This function supports multiple path formats, including string expressions,
 * Path arrays, and AST nodes. It provides a consistent way to measure the
 * complexity or length of a path regardless of its representation.
 *
 * @param path - The path to measure (string, Path array, or AST node).
 * @returns The number of segments in the path.
 *
 * @example
 * Basic usage with different path formats:
 * ```typescript
 * import { getPathDepth } from '@sanity/json-match'
 *
 * const pathStr = 'user.profile.email'
 * console.log(getPathDepth(pathStr)) // 3
 *
 * const pathArr = ['user', 'profile', 'email']
 * console.log(getPathDepth(pathArr)) // 3
 *
 * const pathWithIndex = 'users[0].name'
 * console.log(getPathDepth(pathWithIndex)) // 3
 * ```
 *
 * @public
 */
export declare function getPathDepth(path: string | Path | ExprNode | undefined): number

/**
 * Represents an identifier (property name) in the JSONMatch AST.
 *
 * @public
 */
export declare type IdentifierNode = {
  type: 'Identifier'
  name: string
}

declare type IndexTuple = [number | '', number | '']

/**
 * Joins two path segments into a single, normalized path string.
 *
 * This function is useful for programmatically constructing paths from a base
 * and an additional segment. It handles various path formats, ensuring that
 * the resulting path is correctly formatted.
 *
 * @param base - The base path (string, Path array, or AST node).
 * @param path - The path segment to append (string, Path array, or AST node).
 * @returns A new string representing the combined path.
 *
 * @example
 * Basic joining:
 * ```typescript
 * import { joinPaths } from '@sanity/json-match'
 *
 * const basePath = 'user.profile'
 * const newSegment = 'email'
 * const fullPath = joinPaths(basePath, newSegment)
 * console.log(fullPath) // "user.profile.email"
 * ```
 *
 * @example
 * Replacing the last segment of a path:
 * ```typescript
 * import { joinPaths, slicePath } from '@sanity/json-match'
 *
 * const originalPath = 'user.profile.email'
 * const parentPath = slicePath(originalPath, 0, -1) // "user.profile"
 * const newPath = joinPaths(parentPath, 'contactInfo')
 * console.log(newPath) // "user.profile.contactInfo"
 * ```
 *
 * @example
 * Building paths with array-like segments:
 * ```typescript
 * import { joinPaths } from '@sanity/json-match'
 *
 * let base = 'items'
 * base = joinPaths(base, '[0]') // "items[0]"
 * base = joinPaths(base, '[_key=="abc"]') // "items[0][_key=="abc"]"
 * base = joinPaths(base, 'title') // "items[0][_key=="abc"].title"
 * console.log(base)
 * ```
 *
 * @public
 */
export declare function joinPaths(
  base: string | Path | ExprNode | undefined,
  path: string | Path | ExprNode | undefined,
): string

/**
 * Evaluates a JSONMatch expression against a JSON value and returns all matching entries.
 *
 * This is the core function of the library. It takes a JSON value and a JSONMatch expression
 * and returns a generator that yields all matching values along with their paths. The paths
 * returned are compatible with Sanity's path format and can be used for document operations.
 *
 * @param value - The JSON value to search within
 * @param expr - The JSONMatch expression (string, Path array, or parsed AST)
 * @param basePath - Optional base path to prepend to all result paths
 * @returns Generator yielding MatchEntry objects for each match
 *
 * @example
 * Basic property access:
 * ```typescript
 * const data = { user: { name: "Alice", age: 25 } }
 * const matches = Array.from(jsonMatch(data, "user.name"))
 * // [{ value: "Alice", path: ["user", "name"] }]
 * ```
 *
 * @example
 * Array filtering with constraints:
 * ```typescript
 * const data = {
 *   users: [
 *     { name: "Alice", age: 25 },
 *     { name: "Bob", age: 30 }
 *   ]
 * }
 * const matches = Array.from(jsonMatch(data, "users[age > 28].name"))
 * // [{ value: "Bob", path: ["users", 1, "name"] }]
 * ```
 *
 * @example
 * Using the generator for efficient processing:
 * ```typescript
 * const data = { items: Array(1000).fill(0).map((_, i) => ({ id: i, active: i % 2 === 0 })) }
 *
 * // Find first active item efficiently without processing all items
 * for (const match of jsonMatch(data, "items[active == true]")) {
 *   console.log("First active item:", match.value)
 *   break
 * }
 * ```
 *
 * @public
 */
export declare function jsonMatch(
  value: unknown,
  expr: string | Path | ExprNode,
  basePath?: SingleValuePath,
): Generator<MatchEntry>

declare type KeyedSegment = {
  _key: string
}

/**
 * Represents a single match result from evaluating a JSONMatch expression.
 * Each entry contains the matched value and its path in the document.
 *
 * @example
 * ```typescript
 * const data = { users: [{ name: "Alice" }, { name: "Bob" }] }
 * const matches = Array.from(jsonMatch(data, "users[*].name"))
 * // matches = [
 * //   { value: "Alice", path: ["users", 0, "name"] },
 * //   { value: "Bob", path: ["users", 1, "name"] }
 * // ]
 * ```
 *
 * @public
 */
export declare interface MatchEntry {
  /**
   * The subvalue of the found within the given JSON value. This is
   * referentially equal to the nested value in the JSON object.
   */
  value: unknown
  /**
   * An array of keys and indices representing the location of the value within
   * the original value. Note that the evaluator will only yield paths that
   * address a single value.
   */
  path: SingleValuePath
}

/**
 * Represents a null literal in the JSONMatch AST.
 *
 * @public
 */
export declare type NullNode = {
  type: 'Null'
}

/**
 * Represents a numeric literal in the JSONMatch AST or an index depending on
 * execution the context.
 *
 * @public
 */
export declare type NumberNode = {
  type: 'Number'
  value: number
}

/**
 * Parses various path formats into a standardized JSONMatch AST.
 *
 * This function serves as a universal converter that can handle different path formats
 * used in the Sanity ecosystem. It converts string expressions, Path arrays,
 * and returns AST nodes unchanged. This is useful for normalizing different path
 * representations before processing.
 *
 * @param path - The path to parse (string expression, Path array, or existing AST)
 * @returns The parsed JSONMatch AST node
 *
 * @example
 * Parsing string expressions:
 * ```typescript
 * const ast = parsePath('user.profile.email')
 * // Returns a PathNode AST structure
 * ```
 *
 * @example
 * Converting Path arrays:
 * ```typescript
 * const pathArr = ['users', 0, { _key: 'profile' }, 'email']
 * const ast = parsePath(pathArr)
 * // Converts to equivalent AST: users[0][_key=="profile"].email
 * ```
 *
 * @example
 * Identity operation on AST:
 * ```typescript
 * const existingAst = parse('items[*].name')
 * const result = parsePath(existingAst)
 * console.log(result === existingAst) // true (same object reference)
 * ```
 *
 * @example
 * Working with different segment types:
 * ```typescript
 * const complexPath = [
 *   'data',
 *   'items',
 *   [1, 5],              // slice
 *   { _key: 'metadata' }, // keyed object
 *   'tags',
 *   0                     // array index
 * ]
 * const ast = parsePath(complexPath)
 * console.log(stringifyPath(ast)) // 'data.items[1:5][_key=="metadata"].tags[0]'
 * ```
 *
 * @public
 */
export declare function parsePath(path: string | Path | ExprNode): ExprNode | undefined

/**
 * Represents a path as an array of segments. This is the format used internally
 * and returned by `jsonMatch` in `MatchEntry` objects.
 *
 * Each segment can be:
 * - `string`: Object property name
 * - `number`: Array index
 * - `{_key: string}`: Keyed object reference
 * - `[number | '', number | '']`: Array slices
 *
 * @example
 * ```typescript
 * const path: Path = ['users', 0, 'profile', { _key: 'email' }]
 * // Represents: users[0].profile[_key=="email"]
 * ```
 *
 * @public
 */
export declare type Path = PathSegment[]

/**
 * Represents a path expression in the JSONMatch AST.
 * This is the most common type of expression, representing navigation through an object or array.
 *
 * @public
 */
export declare type PathNode = {
  type: 'Path'
  base?: PathNode
  recursive?: boolean
  segment: SegmentNode
}

/**
 * Represents a single segment in a path.
 *
 * @public
 */
export declare type PathSegment = string | number | KeyedSegment | IndexTuple

/**
 * Represents different types of path segments in the JSONMatch AST.
 *
 * @public
 */
export declare type SegmentNode = ThisNode | IdentifierNode | WildcardNode | SubscriptNode

/**
 * Equivalent to the normal {@link Path} array but without the index tuple.
 * These paths are meant to locate only one value (no index tuple)
 * @public
 */
export declare type SingleValuePath = Exclude<PathSegment, IndexTuple>[]

/**
 * Represents an array slice operation.
 *
 * @public
 */
export declare type SliceNode = {
  type: 'Slice'
  start?: number
  end?: number
}

/**
 * Extracts a section of a path and returns it as a new path string.
 *
 * This function works like `Array.prototype.slice` for path segments. It supports
 * different path formats and handles both positive and negative indices for slicing.
 * This is particularly useful for tasks like getting a parent path or isolating
 * specific parts of a path.
 *
 * @param path - The path to slice (string, Path array, or AST node).
 * @param start - The zero-based index at which to begin extraction. Negative indices are counted from the end.
 * @param end - The zero-based index before which to end extraction. `slice` extracts up to but not including `end`. Negative indices are counted from the end.
 * @returns A new string containing the extracted path segments.
 *
 * @example
 * Basic slicing:
 * ```typescript
 * import { slicePath } from '@sanity/json-match'
 *
 * const path = 'a.b.c.d.e'
 * console.log(slicePath(path, 1, 4)) // "b.c.d"
 * console.log(slicePath(path, 2))    // "c.d.e"
 * ```
 *
 * @example
 * Getting the parent path:
 * ```typescript
 * import { slicePath, getPathDepth } from '@sanity/json-match'
 *
 * const fullPath = 'user.profile.settings.theme'
 *
 * // Using negative indices:
 * const parentPathNegative = slicePath(fullPath, 0, -1)
 * console.log(parentPathNegative) // "user.profile.settings"
 * ```
 *
 * @example
 * Getting the last segment of a path:
 * ```typescript
 * import { slicePath } from '@sanity/json-match'
 *
 * const path = 'user.profile.email'
 * const lastSegment = slicePath(path, -1)
 * console.log(lastSegment) // "email"
 *
 * const complexPath = 'items[0].tags[_key=="abc"].name'
 * const lastSegmentComplex = slicePath(complexPath, -1)
 * console.log(lastSegmentComplex) // "name"
 * ```
 *
 * @public
 */
export declare function slicePath(
  path: string | Path | ExprNode | undefined,
  start?: number,
  end?: number,
): string

/**
 * Converts various path formats to their string representation.
 *
 * This function serves as a universal converter that can handle different path formats
 * used in the Sanity ecosystem. It converts JSONMatch AST nodes and Path arrays
 * to string expressions, while returning string inputs unchanged. This is useful for
 * normalizing different path representations into a consistent string format.
 *
 * @param path - The path to stringify (string expression, Path array, or AST node)
 * @returns The path as a string expression
 *
 * @example
 * Converting AST nodes to strings:
 * ```typescript
 * import { parsePath, stringifyPath } from '@sanity/json-match'
 *
 * const ast = parsePath('users[age > 21].name')
 * const str = stringifyPath(ast) // "users[age>21].name"
 * ```
 *
 * @example
 *
 * Converting `Path` arrays to strings:
 *
 * ```typescript
 * const path = ['users', 0, { _key: 'profile' }, 'email']
 * const str = stringifyPath(path) // 'users[0][_key=="profile"].email'
 *
 * const withSlice = ['items', [1, 3], 'name']
 * const sliceStr = stringifyPath(withSlice) // "items[1:3].name"
 * ```
 *
 * @example
 * Identity operation on strings:
 * ```typescript
 * const existing = 'items[*].name'
 * const result = stringifyPath(existing) // "items[*].name" (same string)
 * ```
 *
 * @example
 * Normalizing expressions:
 * ```typescript
 * const messy = '  users  [  age  >  21  ] . name  '
 * const clean = stringifyPath(parsePath(messy)) // "users[age>21].name"
 * ```
 *
 * @public
 */
export declare function stringifyPath(path: ExprNode | Path | string | undefined): string

/**
 * Represents a string literal in the JSONMatch AST.
 *
 * @public
 */
export declare type StringNode = {
  type: 'String'
  value: string
}

/**
 * Represents elements that can appear inside subscript brackets.
 *
 * @public
 */
export declare type SubscriptElementNode = SliceNode | ComparisonNode | ExistenceNode | ExprNode

/**
 * Represents a subscript operation (bracket notation) in the JSONMatch AST.
 * Can contain multiple elements that are combined with union (OR) semantics.
 *
 * @public
 */
export declare type SubscriptNode = {
  type: 'Subscript'
  elements: SubscriptElementNode[]
}

/**
 * Represents the current context (`@`/`$`) in the JSONMatch AST.
 *
 * @public
 */
export declare type ThisNode = {
  type: 'This'
}

/**
 * Represents a wildcard (*) operation in the JSONMatch AST.
 *
 * @public
 */
export declare type WildcardNode = {
  type: 'Wildcard'
}

export {}

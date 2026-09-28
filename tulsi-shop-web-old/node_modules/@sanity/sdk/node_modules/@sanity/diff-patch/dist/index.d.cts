/**
 * Represents an error that occurred during a diff process.
 * Contains `path`, `value` and `serializedPath` properties,
 * which is helpful for debugging and showing friendly messages.
 *
 * @public
 */
export declare class DiffError extends Error {
  path: Path
  value: unknown
  serializedPath: string
  constructor(message: string, path: Path, value?: unknown)
}

/**
 * Generates an array of mutations for Sanity, based on the differences between
 * the two passed documents/trees.
 *
 * @param source - The first document/tree to compare
 * @param target - The second document/tree to compare
 * @param opts - Options for the diff generation
 * @returns Array of mutations
 * @public
 */
export declare function diffPatch(
  source: DocumentStub,
  target: DocumentStub,
  options?: PatchOptions,
): SanityPatchMutation[]

/**
 * Generates an array of patch operation objects for Sanity, based on the
 * differences between the two passed values
 *
 * @param source - The source value to start off with
 * @param target - The target value that the patch operations will aim to create
 * @param basePath - An optional path that will be prefixed to all subsequent patch operations
 * @returns Array of mutations
 * @public
 */
export declare function diffValue(
  source: unknown,
  target: unknown,
  basePath?: Path,
): SanityPatchOperations[]

/**
 * Represents a partial Sanity document (eg a "stub").
 *
 * @public
 */
export declare interface DocumentStub {
  _id?: string
  _type?: string
  _rev?: string
  _createdAt?: string
  _updatedAt?: string
  [key: string]: unknown
}

/**
 * Options for the patch generator
 *
 * @public
 */
export declare interface PatchOptions {
  /**
   * Document ID to apply the patch to.
   *
   * @defaultValue `undefined` - tries to extract `_id` from passed document
   */
  id?: string
  /**
   * Base path to apply the patch to - useful if diffing sub-branches of a document.
   *
   * @defaultValue `[]` - eg root of the document
   */
  basePath?: Path
  /**
   * Only apply the patch if the document revision matches this value.
   * If the property is the boolean value `true`, it will attempt to extract
   * the revision from the document `_rev` property.
   *
   * @defaultValue `undefined` (do not apply revision check)
   */
  ifRevisionID?: string | true
}

/**
 * An array of path segments representing a path in a document
 *
 * @public
 */
export declare type Path = PathSegment[]

/**
 * A segment of a path
 *
 * @public
 */
export declare type PathSegment =
  | string
  | number
  | {
      _key: string
    }
  | [number | '', number | '']

/**
 * A Sanity `diffMatchPatch` patch mutation operation
 * Patches the given path with the given unidiff string.
 *
 * @public
 */
declare interface SanityDiffMatchPatchOperation {
  diffMatchPatch: Record<string, string>
}

/**
 * A Sanity `insert` patch mutation operation
 * Inserts the given items at the given path (before/after)
 *
 * @public
 */
declare interface SanityInsertPatchOperation {
  insert:
    | {
        before: string
        items: unknown[]
      }
    | {
        after: string
        items: unknown[]
      }
    | {
        replace: string
        items: unknown[]
      }
}

/**
 * Meant to be used as the body of a {@link SanityPatchMutation}'s `patch` key.
 *
 * Contains additional properties to target a particular ID and optionally add
 * an optimistic lock via [`ifRevisionID`](https://www.sanity.io/docs/content-lake/transactions#k29b2c75639d5).
 *
 * @public
 */
export declare interface SanityPatch extends SanityPatchOperations {
  id: string
  ifRevisionID?: string
}

/**
 * A mutation containing a single patch
 *
 * @public
 */
export declare interface SanityPatchMutation {
  patch: SanityPatch
}

/**
 * Serializable patch operations that can be applied to a Sanity document.
 *
 * @public
 */
export declare type SanityPatchOperations = Partial<
  SanitySetPatchOperation &
    SanityUnsetPatchOperation &
    SanityInsertPatchOperation &
    SanityDiffMatchPatchOperation
>

/**
 * A Sanity `set` patch mutation operation
 * Replaces the current path, does not merge
 *
 * @public
 */
declare interface SanitySetPatchOperation {
  set: Record<string, unknown>
}

/**
 * A Sanity `unset` patch mutation operation
 * Unsets the entire value of the given path
 *
 * @public
 */
declare interface SanityUnsetPatchOperation {
  unset: string[]
}

export {}

import { $ as PathElement, A as SafePath, B as Try, C as ParseInnerExpression, D as ParseProperty, E as ParseObject, F as ToArray, G as AnyEmptyArray, I as ToNumber, J as FindBy, K as ByIndex, L as Trim, M as SplitAll, N as StringToPath, O as ParseValue, P as StripError, Q as Path, R as TrimLeft, S as ParseExpressions, T as ParseNumber, V as Unwrap, X as Index, Y as FindInArray, Z as KeyedPathElement, _ as MergeInner, b as ParseAllProps, ct as Tuplify, et as PropertyName, f as Concat, g as Merge, h as Err, j as Split, k as Result, m as Digit, nt as ArrayElement, ot as NormalizeReadOnlyArray, p as ConcatInner, q as ElementType, st as Optional, tt as AnyArray, v as Ok, w as ParseKVPair, x as ParseError, y as OnlyDigits, z as TrimRight } from "./_chunks-dts/index.js";
import { A as StringOp, C as Operation, D as ReplaceOp, E as RemoveOp, M as UnassignOp, N as UnsetOp, O as SetIfMissingOp, P as UpsertOp, S as ObjectOp, T as RelativePosition, _ as DiffMatchPatchOp, a as IdentifiedSanityDocument, b as InsertOp, c as NodePatchList, d as SanityDocumentBase, f as Transaction, g as DecOp, h as AssignOp, i as DeleteMutation, j as TruncateOp, k as SetOp, l as PatchMutation, m as ArrayOp, n as CreateMutation, o as Mutation, p as AnyOp, r as CreateOrReplaceMutation, s as NodePatch, t as CreateIfNotExistsMutation, u as PatchOptions, v as IncOp, w as PrimitiveOp, x as NumberOp, y as InsertIfMissingOp } from "./_chunks-dts/types.js";
import { _ as SanitySetPatch, a as PatchMutationOperation, c as SanityCreateOrReplaceMutation, d as SanityDiffMatchPatch, f as SanityIncPatch, g as SanitySetIfMissingPatch, h as SanityPatch, i as InsertReplace, l as SanityDecPatch, m as SanityMutation, n as InsertAfter, o as SanityCreateIfNotExistsMutation, p as SanityInsertPatch, r as InsertBefore, s as SanityCreateMutation, t as Insert, u as SanityDeleteMutation, v as SanityUnsetPatch } from "./_chunks-dts/types2.js";
import { PatchOperations } from "@sanity/client";
type Id = string;
type RevisionLock = string;
type CompactPath = string;
type ItemRef$1 = string | number;
type DeleteMutation$1 = ['delete', Id];
type CreateMutation$1<Doc> = ['create', Doc];
type CreateIfNotExistsMutation$1<Doc> = ['createIfNotExists', Doc];
type CreateOrReplaceMutation$1<Doc> = ['createOrReplace', Doc];
type UnsetMutation = ['patch', 'unset', Id, CompactPath, [], RevisionLock?];
type InsertMutation = ['patch', 'insert', Id, CompactPath, [RelativePosition, ItemRef$1, AnyArray], RevisionLock?];
type UpsertMutation = ['patch', 'upsert', Id, CompactPath, [RelativePosition, ItemRef$1, AnyArray], RevisionLock?];
type InsertIfMissingMutation = ['patch', 'insertIfMissing', Id, CompactPath, [RelativePosition, ItemRef$1, AnyArray], RevisionLock?];
type TruncateMutation = ['patch', 'truncate', Id, CompactPath, [startIndex: number, endIndex: number | undefined], RevisionLock?];
type IncMutation = ['patch', 'inc', Id, CompactPath, [number], RevisionLock?];
type DecMutation = ['patch', 'dec', Id, CompactPath, [number], RevisionLock?];
type AssignMutation = ['patch', 'assign', Id, CompactPath, [object], RevisionLock?];
type UnassignMutation = ['patch', 'assign', Id, CompactPath, [string[]], RevisionLock?];
type ReplaceMutation = ['patch', 'replace', Id, CompactPath, [ItemRef$1, AnyArray], RevisionLock?];
type RemoveMutation = ['patch', 'remove', Id, CompactPath, [ItemRef$1], RevisionLock?];
type SetMutation = ['patch', 'set', Id, CompactPath, any, RevisionLock?];
type SetIfMissingMutation = ['patch', 'setIfMissing', Id, CompactPath, [unknown], RevisionLock?];
type DiffMatchPatchMutation = ['patch', 'diffMatchPatch', Id, CompactPath, [string], RevisionLock?];
type CompactPatchMutation = UnsetMutation | InsertMutation | UpsertMutation | InsertIfMissingMutation | TruncateMutation | IncMutation | DecMutation | SetMutation | SetIfMissingMutation | DiffMatchPatchMutation | AssignMutation | UnassignMutation | ReplaceMutation | RemoveMutation;
type CompactMutation<Doc> = DeleteMutation$1 | CreateMutation$1<Doc> | CreateIfNotExistsMutation$1<Doc> | CreateOrReplaceMutation$1<Doc> | CompactPatchMutation;
declare function decode$1<Doc extends SanityDocumentBase>(mutations: CompactMutation<Doc>[]): Mutation[];
declare function encode$1<Doc extends SanityDocumentBase>(mutations: Mutation[]): CompactMutation<Doc>[];
declare namespace index_d_exports {
  export { AssignMutation, CompactMutation, CompactPatchMutation, CompactPath, CreateIfNotExistsMutation$1 as CreateIfNotExistsMutation, CreateMutation$1 as CreateMutation, CreateOrReplaceMutation$1 as CreateOrReplaceMutation, DecMutation, DeleteMutation$1 as DeleteMutation, DiffMatchPatchMutation, Id, IncMutation, InsertIfMissingMutation, InsertMutation, ItemRef$1 as ItemRef, RemoveMutation, ReplaceMutation, RevisionLock, SetIfMissingMutation, SetMutation, TruncateMutation, UnassignMutation, UnsetMutation, UpsertMutation, decode$1 as decode, encode$1 as encode };
}
/**
 * @deprecated
 */
type FormPatchPathKeyedSegment = {
  _key: string;
};
/**
 * @deprecated
 */
type FormPatchPathIndexTuple = [number | '', number | ''];
/**
 * @deprecated
 */
type FormPatchPathSegment = string | number | FormPatchPathKeyedSegment | FormPatchPathIndexTuple;
/**
 * @deprecated
 */
type FormPatchPath = FormPatchPathSegment[];
/**
 * A variant of the FormPath type that never contains index tupes
 */
type CompatPath = Exclude<ElementType<FormPatchPath>, FormPatchPathIndexTuple>[];
/**
 *
 * @internal
 * @deprecated
 */
type FormPatchJSONValue = number | string | boolean | {
  [key: string]: FormPatchJSONValue;
} | FormPatchJSONValue[];
/**
 *
 * @internal
 * @deprecated
 */
type FormPatchOrigin = 'remote' | 'local' | 'internal';
/**
 *
 * @internal
 * @deprecated
 */
interface FormSetPatch {
  path: FormPatchPath;
  type: 'set';
  value: FormPatchJSONValue;
}
/**
 *
 * @internal
 * @deprecated
 */
interface FormIncPatch {
  path: FormPatchPath;
  type: 'inc';
  value: FormPatchJSONValue;
}
/**
 *
 * @internal
 * @deprecated
 */
interface FormDecPatch {
  path: FormPatchPath;
  type: 'dec';
  value: FormPatchJSONValue;
}
/**
 *
 * @internal
 * @deprecated
 */
interface FormSetIfMissingPatch {
  path: FormPatchPath;
  type: 'setIfMissing';
  value: FormPatchJSONValue;
}
/**
 *
 * @internal
 * @deprecated
 */
interface FormUnsetPatch {
  path: FormPatchPath;
  type: 'unset';
}
/**
 *
 * @internal
 * @deprecated
 */
type FormInsertPatchPosition = 'before' | 'after';
/**
 *
 * @internal
 * @deprecated
 */
interface FormInsertPatch {
  path: FormPatchPath;
  type: 'insert';
  position: FormInsertPatchPosition;
  items: FormPatchJSONValue[];
}
/**
 *
 * @internal
 * @deprecated
 */
interface FormDiffMatchPatch {
  path: FormPatchPath;
  type: 'diffMatchPatch';
  value: string;
}
/**
 *
 * @internal
 * @deprecated
 */
type FormPatchLike = FormSetPatch | FormSetIfMissingPatch | FormUnsetPatch | FormInsertPatch | FormDiffMatchPatch;
/**
 * Convert a Sanity form patch (ie emitted from an input component) to a {@link NodePatch}
 * Note the lack of encodeMutation here. Sanity forms never emit *mutations*, only patches
 * @param patches - Array of {@link FormPatchLike}
 * @internal
 */
declare function encodePatches(patches: FormPatchLike[]): NodePatch[];
declare namespace index_d_exports$1 {
  export { CompatPath, FormDecPatch, FormDiffMatchPatch, FormIncPatch, FormInsertPatch, FormInsertPatchPosition, FormPatchJSONValue, FormPatchLike, FormPatchOrigin, FormPatchPath, FormPatchPathIndexTuple, FormPatchPathKeyedSegment, FormPatchPathSegment, FormSetIfMissingPatch, FormSetPatch, FormUnsetPatch, encodePatches };
}
declare function decodeAll<Doc extends SanityDocumentBase>(sanityMutations: SanityMutation<Doc>[]): Mutation[];
declare function decode<Doc extends SanityDocumentBase>(encodedMutation: SanityMutation<Doc>): Mutation;
declare function encode(mutation: Mutation): SanityMutation[] | SanityMutation;
declare function encodeAll(mutations: Mutation[]): SanityMutation[];
declare function encodeTransaction(transaction: Transaction): {
  transactionId: string | undefined;
  mutations: SanityMutation[];
};
declare function encodeMutation(mutation: Mutation): SanityMutation[] | SanityMutation;
declare function encodePatch(patch: NodePatch): PatchOperations;
declare namespace index_d_exports$2 {
  export { Insert, InsertAfter, InsertBefore, InsertReplace, Mutation, PatchMutationOperation, SanityCreateIfNotExistsMutation, SanityCreateMutation, SanityCreateOrReplaceMutation, SanityDecPatch, SanityDeleteMutation, SanityDiffMatchPatch, SanityDocumentBase, SanityIncPatch, SanityInsertPatch, SanityMutation, SanityPatch, SanitySetIfMissingPatch, SanitySetPatch, SanityUnsetPatch, decode, decodeAll, encode, encodeAll, encodeMutation, encodePatch, encodeTransaction };
}
declare namespace compact_d_exports {
  export { ItemRef, format };
}
type ItemRef = string | number;
declare function format<Doc extends SanityDocumentBase>(mutations: Mutation[]): string;
type Arrify<T> = (T extends (infer E)[] ? E : T)[];
declare function autoKeys<Item>(generateKey: (item: Item) => string): {
  insert: <Pos extends RelativePosition, Ref extends Index | KeyedPathElement>(position: Pos, referenceItem: Ref, items: Item[]) => InsertOp<(Item & {
    _key: string;
  })[], Pos, Ref>;
  upsert: <Pos extends RelativePosition, ReferenceItem extends KeyedPathElement>(items: Item[], position: Pos, referenceItem: ReferenceItem) => UpsertOp<Arrify<Item & {
    _key: string;
  }>, Pos, ReferenceItem>;
  replace: <Pos extends RelativePosition, ReferenceItem extends Index | KeyedPathElement>(items: Item[], position: Pos, referenceItem: ReferenceItem) => ReplaceOp<(Item & {
    _key: string;
  })[], ReferenceItem>;
  insertBefore: <Ref extends Index | KeyedPathElement>(ref: Ref, items: Item[]) => InsertOp<(Item & {
    _key: string;
  })[], "before", Ref>;
  prepend: (items: Item[]) => InsertOp<(Item & {
    _key: string;
  })[], "before", 0>;
  insertAfter: <Ref extends Index | KeyedPathElement>(ref: Ref, items: Item[]) => InsertOp<(Item & {
    _key: string;
  })[], "after", Ref>;
  append: (items: Item[]) => InsertOp<(Item & {
    _key: string;
  })[], "after", -1>;
};
declare function create<const Doc extends Optional<SanityDocumentBase, '_id'>>(document: Doc): CreateMutation<Doc>;
declare function patch<P extends NodePatchList | NodePatch>(id: string, patches: P, options?: PatchOptions): PatchMutation<NormalizeReadOnlyArray<Tuplify<P>>>;
declare function at<const P extends Path, O extends Operation>(path: P, operation: O): NodePatch<NormalizeReadOnlyArray<P>, O>;
declare function at<const P extends string, O extends Operation>(path: P, operation: O): NodePatch<SafePath<P>, O>;
declare function createIfNotExists<const Doc extends SanityDocumentBase>(document: Doc): CreateIfNotExistsMutation<Doc>;
declare function createOrReplace<const Doc extends SanityDocumentBase>(document: Doc): CreateOrReplaceMutation<Doc>;
declare function delete_<const Id extends string>(id: Id): DeleteMutation<Id>;
declare const del: typeof delete_;
declare const destroy: typeof delete_;
declare const set: <const T>(value: T) => SetOp<T>;
declare const assign: <const T extends { [K in string]: unknown }>(value: T) => AssignOp<T>;
declare const unassign: <const K extends readonly string[]>(keys: K) => UnassignOp<K>;
declare const setIfMissing: <const T>(value: T) => SetIfMissingOp<T>;
declare const unset: () => UnsetOp;
declare const inc: <const N extends number = 1>(amount?: N) => IncOp<N>;
declare const dec: <const N extends number = 1>(amount?: N) => DecOp<N>;
declare const diffMatchPatch: (value: string) => DiffMatchPatchOp;
declare function insert<const Items extends AnyArray<unknown>, const Pos extends RelativePosition, const ReferenceItem extends Index | KeyedPathElement>(items: Items | ArrayElement<Items>, position: Pos, indexOrReferenceItem: ReferenceItem): InsertOp<NormalizeReadOnlyArray<Items>, Pos, ReferenceItem>;
declare function append<const Items extends AnyArray<unknown>>(items: Items | ArrayElement<Items>): InsertOp<NormalizeReadOnlyArray<Items>, "after", -1>;
declare function prepend<const Items extends AnyArray<unknown>>(items: Items | ArrayElement<Items>): InsertOp<NormalizeReadOnlyArray<Items>, "before", 0>;
declare function insertBefore<const Items extends AnyArray<unknown>, const ReferenceItem extends Index | KeyedPathElement>(items: Items | ArrayElement<Items>, indexOrReferenceItem: ReferenceItem): InsertOp<NormalizeReadOnlyArray<Items>, "before", ReferenceItem>;
declare const insertAfter: <const Items extends AnyArray<unknown>, const ReferenceItem extends Index | KeyedPathElement>(items: Items | ArrayElement<Items>, indexOrReferenceItem: ReferenceItem) => InsertOp<NormalizeReadOnlyArray<Items>, "after", ReferenceItem>;
declare function truncate(startIndex: number, endIndex?: number): TruncateOp;
declare function replace<Items extends any[], ReferenceItem extends Index | KeyedPathElement>(items: Items | ArrayElement<Items>, referenceItem: ReferenceItem): ReplaceOp<Items, ReferenceItem>;
declare function remove<ReferenceItem extends Index | KeyedPathElement>(referenceItem: ReferenceItem): RemoveOp<ReferenceItem>;
declare function upsert<const Item extends {
  _key: string;
}, const Pos extends RelativePosition, const ReferenceItem extends Index | KeyedPathElement>(items: Item | Item[], position: Pos, referenceItem: ReferenceItem): UpsertOp<Arrify<Item>, Pos, ReferenceItem>;
declare function insertIfMissing<const Item extends {
  _key: string;
}, const Pos extends RelativePosition, const ReferenceItem extends Index | KeyedPathElement>(items: Item | Item[], position: Pos, referenceItem: ReferenceItem): InsertIfMissingOp<Arrify<Item>, Pos, ReferenceItem>;
export { type AnyArray, type AnyEmptyArray, type AnyOp, type ArrayElement, type ArrayOp, type Arrify, type AssignOp, type ByIndex, index_d_exports as CompactEncoder, compact_d_exports as CompactFormatter, type Concat, type ConcatInner, type CreateIfNotExistsMutation, type CreateMutation, type CreateOrReplaceMutation, type DecOp, type DeleteMutation, type DiffMatchPatchOp, type Digit, type ElementType, type Err, type FindBy, type FindInArray, index_d_exports$1 as FormCompatEncoder, type IdentifiedSanityDocument, type IncOp, type Index, type InsertIfMissingOp, type InsertOp, type KeyedPathElement, type Merge, type MergeInner, type Mutation, type NodePatch, type NodePatchList, type NormalizeReadOnlyArray, type NumberOp, type ObjectOp, type Ok, type OnlyDigits, type Operation, type Optional, type ParseAllProps, type ParseError, type ParseExpressions, type ParseInnerExpression, type ParseKVPair, type ParseNumber, type ParseObject, type ParseProperty, type ParseValue, type PatchMutation, type PatchOptions, type Path, type PathElement, type PrimitiveOp, type PropertyName, type RelativePosition, type RemoveOp, type ReplaceOp, type Result, type SafePath, type SanityDocumentBase, index_d_exports$2 as SanityEncoder, type SetIfMissingOp, type SetOp, type Split, type SplitAll, type StringOp, type StringToPath, type StripError, type ToArray, type ToNumber, type Transaction, type Trim, type TrimLeft, type TrimRight, type TruncateOp, type Try, type Tuplify, type UnassignOp, type UnsetOp, type Unwrap, type UpsertOp, append, assign, at, autoKeys, create, createIfNotExists, createOrReplace, dec, del, delete_, destroy, diffMatchPatch, inc, insert, insertAfter, insertBefore, insertIfMissing, patch, prepend, remove, replace, set, setIfMissing, truncate, unassign, unset, upsert };
//# sourceMappingURL=index.d.ts.map
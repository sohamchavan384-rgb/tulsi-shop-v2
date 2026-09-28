import { $ as PathElement, A as SafePath, B as Try, C as ParseInnerExpression, D as ParseProperty, E as ParseObject, F as ToArray, G as AnyEmptyArray, H as Get, I as ToNumber, J as FindBy, K as ByIndex, L as Trim, M as SplitAll, N as StringToPath, O as ParseValue, P as StripError, Q as Path, R as TrimLeft, S as ParseExpressions, T as ParseNumber, U as GetAtPath, V as Unwrap, W as getAtPath, X as Index$1, Y as FindInArray, Z as KeyedPathElement, _ as MergeInner, a as isKeyElement, at as Format, b as ParseAllProps, c as startsWith, d as parse, et as PropertyName, f as Concat, g as Merge, h as Err, i as isIndexElement, it as EmptyArray, j as Split, k as Result, l as normalize, m as Digit, n as isElementEqual, nt as ArrayElement, o as isKeyedElement, ot as NormalizeReadOnlyArray, p as ConcatInner, q as ElementType, r as isEqual, rt as ArrayLength, s as isPropertyElement, st as Optional, t as isArrayElement, tt as AnyArray, u as stringify, v as Ok, w as ParseKVPair, x as ParseError, y as OnlyDigits, z as TrimRight } from "./_chunks-dts/index.js";
import { A as StringOp, C as Operation, D as ReplaceOp, E as RemoveOp, M as UnassignOp, N as UnsetOp, O as SetIfMissingOp, P as UpsertOp, S as ObjectOp, T as RelativePosition, _ as DiffMatchPatchOp, b as InsertOp, c as NodePatchList, d as SanityDocumentBase, g as DecOp, h as AssignOp, i as DeleteMutation, j as TruncateOp, k as SetOp, l as PatchMutation, m as ArrayOp, n as CreateMutation, o as Mutation, p as AnyOp, r as CreateOrReplaceMutation, s as NodePatch, t as CreateIfNotExistsMutation, u as PatchOptions, v as IncOp, w as PrimitiveOp, x as NumberOp, y as InsertIfMissingOp } from "./_chunks-dts/types.js";
import { Call, Numbers, Tuples } from "hotscript";
/**
 * Extracts the document shape an "add"-flavored mutation contributes.
 * `delete` and `patch` don't introduce new shapes.
 */
type AddedDocument<M> = M extends CreateMutation<infer D> ? D : M extends CreateIfNotExistsMutation<infer D> ? D : M extends CreateOrReplaceMutation<infer D> ? D : never;
/**
 * Extracts the literal `_id` of any delete mutation in the union.
 * `DeleteMutation<string>` (non-literal id) extracts to `string`, which
 * makes Exclude<…> a no-op — so non-literal deletes leave the result
 * type alone, which is the right behaviour.
 */
type DeletedId<M> = M extends DeleteMutation<infer Id> ? Id : never;
type MutationOf<Muts> = Muts extends readonly Mutation[] ? Muts[number] : Muts;
declare function applyInCollection<const Doc extends SanityDocumentBase, const Muts extends Mutation | readonly Mutation[]>(collection: readonly Doc[], mutations: Muts): readonly Exclude<Doc | AddedDocument<MutationOf<Muts>>, {
  _id: DeletedId<MutationOf<Muts>>;
}>[];
type RequiredSelect<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: T[P] };
declare const createStore: <Doc extends SanityDocumentBase>(initialEntries?: Doc[]) => {
  readonly version: number;
  entries: () => [string, Format<ToStored<Doc & SanityDocumentBase>>][];
  get: <Id extends string>(id: Id) => Format<Omit<Format<ToStored<Doc & SanityDocumentBase>>, "_id"> & {
    _id: Id;
  }>;
  apply: (mutations: Mutation[] | Mutation) => void;
};
declare function hasId(doc: SanityDocumentBase): doc is StoredDocument;
declare function assignId<Doc extends SanityDocumentBase>(doc: Doc, generateId: () => string): Doc & {
  _id: string;
};
type DocumentIndex<Doc extends SanityDocumentBase> = {
  [id: string]: Doc;
};
declare function applyInIndex<Doc extends SanityDocumentBase, Index extends DocumentIndex<ToStored<Doc>>>(index: Index, mutations: Mutation<Doc>[]): Index;
type ToStored<Doc extends SanityDocumentBase> = Doc & Required<SanityDocumentBase>;
type ToIdentified<Doc extends SanityDocumentBase> = RequiredSelect<Doc, '_id'>;
type StoredDocument = ToStored<SanityDocumentBase>;
type Between<Num extends number, Min extends number, Max extends number> = Call<Numbers.GreaterThanOrEqual<Num, Min>> extends true ? Call<Numbers.LessThanOrEqual<Num, Max>> extends true ? true : false : false;
type LastIndexOnEmptyArray<Index, Length> = Length extends 0 ? Index extends -1 ? true : false : false;
type NormalizeIndex<Index extends number, Length extends number> = LastIndexOnEmptyArray<Index, Length> extends true ? 0 : Call<Numbers.LessThan<Index, 0>> extends true ? Call<Numbers.Add, Length, Index> : Index;
type AdjustIndex<Pos extends 'before' | 'after', Index extends number> = Pos extends 'before' ? Index : Call<Numbers.Add, Index, 1>;
type SplitAtPos<Current extends unknown[], NormalizedIndex extends number, Pos extends 'before' | 'after'> = Call<Tuples.SplitAt<AdjustIndex<Pos, NormalizedIndex>, Current>>;
type _InsertAtIndex<Current extends unknown[], Values extends unknown[], Pos extends 'before' | 'after', NormalizedIndex extends number> = Between<NormalizedIndex, 0, ArrayLength<Current>> extends true ? SplitAtPos<Current, NormalizedIndex, Pos> extends [infer Head, infer Tail] ? Head extends AnyArray ? Tail extends AnyArray ? [...(Head extends never[] ? [] : Head), ...Values, ...(Tail extends never[] ? [] : Tail)] : never : never : never : Current;
type InsertAtIndex<Current extends unknown[], Values extends unknown[], Pos extends 'before' | 'after', Index extends number> = _InsertAtIndex<Current, Values, Pos, NormalizeIndex<Index, ArrayLength<Current>>>;
type DropFirst<Array extends unknown[]> = Array extends [infer Head, ...infer Rest] ? Rest : [];
type _RemoveAtIndex<Current extends unknown[], Index extends number> = Between<Index, 0, ArrayLength<Current>> extends true ? Call<Tuples.SplitAt<Index>, Current> extends [infer Head, infer Tail] ? Head extends AnyArray ? Tail extends AnyArray ? [...(Head extends never[] ? [] : Head), ...(Tail extends never[] ? [] : Tail extends unknown[] ? DropFirst<Tail> : Tail)] : never : never : never : Current;
type RemoveAtIndex<Current extends unknown[], Index extends number> = _RemoveAtIndex<Current, NormalizeIndex<Index, ArrayLength<Current>>>;
type ArrayInsert<Current extends unknown[], Items extends unknown[], Pos extends 'before' | 'after', Ref extends number | KeyedPathElement> = Current extends (infer E)[] ? number extends Ref ? (E | ArrayElement<Items>)[] : Ref extends number ? InsertAtIndex<Current, Items, Pos, Ref> : (E | ArrayElement<Items>)[] : Current;
type ArrayRemove<Current extends unknown[], Ref extends number | KeyedPathElement> = number extends Ref ? Current : Ref extends number ? RemoveAtIndex<Current, Ref> : Current;
type Assign<Current, Attrs> = { [K in keyof Attrs | keyof Current]: K extends keyof Attrs ? Attrs[K] : K extends keyof Current ? Current[K] : never };
type ApplyOp<O extends Operation, Current> = Current extends never ? never : O extends SetOp<infer Next> ? Next : O extends UnsetOp ? undefined : O extends IncOp<infer Amount> ? Current extends number ? number extends Current ? number : Call<Numbers.Add, Current, Amount> : Current : O extends DecOp<infer Amount> ? Current extends number ? number extends Current ? number : Call<Numbers.Sub, Current, Amount> : Current : O extends InsertOp<infer Items, infer Pos, infer Ref> ? Current extends AnyArray<unknown> ? ArrayInsert<NormalizeReadOnlyArray<Current>, NormalizeReadOnlyArray<Items>, Pos, Ref> : Current : O extends ReplaceOp<infer Items, infer Ref> ? Current extends any[] ? (ArrayElement<Items> | ArrayElement<Current>)[] : never : O extends AssignOp<infer U> ? Assign<Current, U> : O extends SetIfMissingOp<infer V> ? Current extends undefined | null ? V : Current : O extends UnassignOp<infer U> ? { [K in keyof Current as Exclude<K, ArrayElement<U>>]: Current[K] } : O extends DiffMatchPatchOp ? string : O extends RemoveOp<infer Ref> ? Current extends AnyArray<unknown> ? ArrayRemove<NormalizeReadOnlyArray<Current>, Ref> : Current : Current;
type PickOrUndef<T, Head> = Head extends keyof T ? T[Head] : undefined;
type ApplyInObject<Head, Tail extends AnyArray, Op extends Operation, Node> = Head extends keyof Node ? { [K in keyof Node]: K extends Head ? ApplyAtPath<Tail, Op, PickOrUndef<Node, Head>> : Node[K] } : Tail extends EmptyArray ? Head extends string ? Format<Node & { [K in Head]: ApplyOp<Op, undefined> }> : never : Node;
type ApplyAtIndex<Index extends number, Tail extends AnyArray, Op extends Operation, Arr extends AnyArray> = [...Call<Tuples.Take<Index, Arr>>, ApplyAtPath<Tail, Op, Arr[Index]>, ...Call<Tuples.Drop<Call<Numbers.Add<Index, 1>>, Arr>>];
type ApplyAtSelector<Selector extends KeyedPathElement, Tail extends AnyArray, Op extends Operation, Arr extends AnyArray> = FirstIndexOf<0, Selector, Arr> extends infer Index ? Index extends number ? ApplyAtIndex<Index, Tail, Op, Arr> : Arr : Arr;
type FirstIndexOf<StartIndex extends number, Selector extends KeyedPathElement, Arr extends AnyArray> = Arr extends [infer Head, ...infer Tail] ? Head extends Selector ? StartIndex : FirstIndexOf<Call<Numbers.Add<StartIndex>, 1>, Selector, Tail> : null;
type ApplyInArray<ItemSelector, Tail extends AnyArray, Op extends Operation, Arr extends AnyArray> = ItemSelector extends number ? ApplyAtIndex<ItemSelector, Tail, Op, Arr> : ItemSelector extends KeyedPathElement ? ApplyAtSelector<ItemSelector, Tail, Op, Arr> : never;
type ApplyAtPath<Pth extends Path, Op extends Operation, Node> = Pth extends EmptyArray ? ApplyOp<Op, Node> : Pth extends [infer Head, ...infer Tail] ? Node extends AnyArray ? ApplyInArray<Head, Tail, Op, Node> : Node extends { [K in string]: unknown } ? ApplyInObject<Head, Tail, Op, Node> : never : never;
type ApplyPatches<Patches, Node> = Patches extends [infer HeadPatch, ...infer TailPatch] ? HeadPatch extends NodePatch ? TailPatch extends [] ? ApplyNodePatch<HeadPatch, Node> : TailPatch extends NodePatch[] ? ApplyPatches<TailPatch, ApplyNodePatch<HeadPatch, Node>> : Node : Node : Node;
type ApplyNodePatch<Patch extends NodePatch, Node> = Patch extends NodePatch<infer P, infer Op> ? ApplyAtPath<P, Op, Node> : ApplyAtPath<Patch['path'], Patch['op'], Node>;
type ApplyPatchMutation<Mutation extends PatchMutation, Doc extends SanityDocumentBase> = Mutation extends PatchMutation<infer Patches> ? ApplyPatches<NormalizeReadOnlyArray<Patches>, Doc> : Doc;
declare function applyPatchMutation<const Mutation extends PatchMutation, const Doc extends SanityDocumentBase>(mutation: Mutation, document: Doc): ApplyPatchMutation<Mutation, Doc>;
declare function applyPatches<Patches extends NodePatchList, const Doc>(patches: Patches, document: Doc): ApplyPatches<NormalizeReadOnlyArray<Patches>, Doc>;
declare function applyNodePatch<const Patch extends NodePatch, const Doc>(patch: Patch, document: Doc): ApplyNodePatch<Patch, Doc>;
declare function applyOp<const Op extends AnyOp, const CurrentValue>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>;
declare function applyOp<const Op extends NumberOp, const CurrentValue extends number>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>;
declare function applyOp<const Op extends StringOp, const CurrentValue extends string>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>;
declare function applyOp<const Op extends ObjectOp, const CurrentValue extends { [k in keyof any]: unknown }>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>;
declare function applyOp<const Op extends ArrayOp, const CurrentValue extends AnyArray>(op: Op, currentValue: CurrentValue): ApplyOp<Op, CurrentValue>;
export { type AdjustIndex, type AnyArray, type AnyEmptyArray, type AnyOp, type ApplyAtIndex, type ApplyAtPath, type ApplyAtSelector, type ApplyInArray, type ApplyInObject, type ApplyNodePatch, type ApplyOp, ApplyPatchMutation, type ApplyPatches, type ArrayElement, type ArrayInsert, type ArrayLength, type ArrayOp, type ArrayRemove, type Assign, type AssignOp, type Between, type ByIndex, type Concat, type ConcatInner, type CreateIfNotExistsMutation, type CreateMutation, type CreateOrReplaceMutation, type DecOp, type DeleteMutation, type DiffMatchPatchOp, type Digit, DocumentIndex, type DropFirst, type ElementType, type EmptyArray, type Err, type FindBy, type FindInArray, type FirstIndexOf, type Format, type Get, type GetAtPath, type IncOp, type Index$1 as Index, type InsertAtIndex, type InsertIfMissingOp, type InsertOp, type KeyedPathElement, type LastIndexOnEmptyArray, type Merge, type MergeInner, type Mutation, type NodePatch, type NodePatchList, type NormalizeIndex, type NormalizeReadOnlyArray, type NumberOp, type ObjectOp, type Ok, type OnlyDigits, type Operation, type Optional, type ParseAllProps, type ParseError, type ParseExpressions, type ParseInnerExpression, type ParseKVPair, type ParseNumber, type ParseObject, type ParseProperty, type ParseValue, type PatchMutation, type PatchOptions, type Path, type PathElement, type PickOrUndef, type PrimitiveOp, type PropertyName, type RelativePosition, type RemoveAtIndex, type RemoveOp, type ReplaceOp, RequiredSelect, type Result, type SafePath, type SanityDocumentBase, type SetIfMissingOp, type SetOp, type Split, type SplitAll, type SplitAtPos, StoredDocument, type StringOp, type StringToPath, type StripError, type ToArray, ToIdentified, type ToNumber, ToStored, type Trim, type TrimLeft, type TrimRight, type TruncateOp, type Try, type UnassignOp, type UnsetOp, type Unwrap, type UpsertOp, type _InsertAtIndex, type _RemoveAtIndex, applyInCollection, applyInIndex, applyNodePatch, applyOp, applyPatchMutation, applyPatches, assignId, createStore, type getAtPath, hasId, type isArrayElement, type isElementEqual, type isEqual, type isIndexElement, type isKeyElement, type isKeyedElement, type isPropertyElement, type normalize, type parse, type startsWith, type stringify };
//# sourceMappingURL=_unstable_apply.d.ts.map
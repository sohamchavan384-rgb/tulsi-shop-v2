/** @public */
declare type IndexTuple = [number | '', number | ''];
/** @public */
declare type KeyedSegment = {
  _key: string;
};
/** @public */
type PathSegment = string | number | KeyedSegment | IndexTuple;
/** @public */
type Path = PathSegment[];
/** @public */
type JSONValue = number | string | boolean | {
  [key: string]: JSONValue;
} | JSONValue[];
/** @public */
type Origin = 'remote' | 'local' | 'internal';
/** @public */
type IncPatch = {
  path: Path;
  origin?: Origin;
  type: 'inc';
  value: JSONValue;
};
/** @public */
type DecPatch = {
  path: Path;
  origin?: Origin;
  type: 'dec';
  value: JSONValue;
};
/** @public */
type SetPatch = {
  path: Path;
  type: 'set';
  origin?: Origin;
  value: JSONValue;
};
/** @public */
type SetIfMissingPatch = {
  path: Path;
  origin?: Origin;
  type: 'setIfMissing';
  value: JSONValue;
};
/** @public */
type UnsetPatch = {
  path: Path;
  origin?: Origin;
  type: 'unset';
};
/** @public */
type InsertPosition = 'before' | 'after' | 'replace';
/** @public */
type InsertPatch = {
  path: Path;
  origin?: Origin;
  type: 'insert';
  position: InsertPosition;
  items: JSONValue[];
};
/** @public */
type DiffMatchPatch = {
  path: Path;
  type: 'diffMatchPatch';
  origin?: Origin;
  value: string;
};
/** @public */
type Patch = SetPatch | SetIfMissingPatch | UnsetPatch | InsertPatch | DiffMatchPatch | IncPatch | DecPatch;
/** @beta */
declare function applyAll<TValue>(value: TValue, patches: Array<Patch>): TValue;
/** @public */
declare function setIfMissing(value: any, path?: Path): SetIfMissingPatch;
/** @public */
declare function diffMatchPatch(currentValue: string, nextValue: string, path?: Path): DiffMatchPatch;
/** @public */
declare function insert(items: any[], position: InsertPosition, path?: Path): InsertPatch;
/** @public */
declare function set(value: any, path?: Path): SetPatch;
/** @public */
declare function unset(path?: Path): UnsetPatch;
/** @internal */
declare function prefixPath<T extends {
  path: Path;
}>(patch: T, segment: PathSegment): T;
export { DecPatch, DiffMatchPatch, IncPatch, IndexTuple, InsertPatch, InsertPosition, JSONValue, KeyedSegment, Origin, Patch, Path, PathSegment, SetIfMissingPatch, SetPatch, UnsetPatch, applyAll, diffMatchPatch, insert, prefixPath, set, setIfMissing, unset };
//# sourceMappingURL=index.d.ts.map
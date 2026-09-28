import { a as IdentifiedSanityDocument, d as SanityDocumentBase } from "./types.js";
import { Mutation as SanityMutation, PatchMutationOperation, PatchOperations } from "@sanity/client";
type SanityDiffMatchPatch = {
  id: string;
  diffMatchPatch: {
    [path: string]: string;
  };
};
type SanitySetPatch = {
  id: string;
  set: {
    [path: string]: any;
  };
};
type InsertBefore = {
  before: string;
  items: any[];
};
type InsertAfter = {
  after: string;
  items: any[];
};
type InsertReplace = {
  replace: string;
  items: any[];
};
type Insert = InsertBefore | InsertAfter | InsertReplace;
type SanityInsertPatch = {
  id: string;
  insert: Insert;
};
type SanityUnsetPatch = {
  id: string;
  unset: string[];
};
type SanityIncPatch = {
  id: string;
  inc: {
    [path: string]: number;
  };
};
type SanityDecPatch = {
  id: string;
  dec: {
    [path: string]: number;
  };
};
type SanitySetIfMissingPatch = {
  id: string;
  setIfMissing: {
    [path: string]: any;
  };
};
type SanityPatch = PatchOperations & {
  id: string;
};
type SanityCreateIfNotExistsMutation<Doc extends IdentifiedSanityDocument = IdentifiedSanityDocument> = {
  createIfNotExists: Doc;
};
type SanityCreateOrReplaceMutation<Doc extends IdentifiedSanityDocument = IdentifiedSanityDocument> = {
  createOrReplace: Doc;
};
type SanityCreateMutation<Doc extends SanityDocumentBase> = {
  create: Doc;
};
type SanityDeleteMutation = {
  delete: {
    id: string;
  };
};
export { SanitySetPatch as _, PatchMutationOperation as a, SanityCreateOrReplaceMutation as c, SanityDiffMatchPatch as d, SanityIncPatch as f, SanitySetIfMissingPatch as g, SanityPatch as h, InsertReplace as i, SanityDecPatch as l, SanityMutation as m, InsertAfter as n, SanityCreateIfNotExistsMutation as o, SanityInsertPatch as p, InsertBefore as r, SanityCreateMutation as s, Insert as t, SanityDeleteMutation as u, SanityUnsetPatch as v };
//# sourceMappingURL=types2.d.ts.map
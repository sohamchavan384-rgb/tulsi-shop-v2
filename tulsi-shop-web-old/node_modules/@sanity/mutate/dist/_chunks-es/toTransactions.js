import groupBy from "lodash/groupBy.js";
import { assignId, hasId, applyPatchMutation, applyNodePatch, applyPatches } from "./utils.js";
import { getAtPath } from "./getAtPath.js";
import { nanoid } from "nanoid";
import { stringifyPatches, makePatches } from "@sanity/diff-match-patch";
import { stringify, startsWith } from "./stringify.js";
import { uuid } from "@sanity/uuid";
function getMutationDocumentId(mutation) {
  if (mutation.type === "patch")
    return mutation.id;
  if (mutation.type === "create")
    return mutation.document._id;
  if (mutation.type === "delete")
    return mutation.id;
  if (mutation.type === "createIfNotExists" || mutation.type === "createOrReplace")
    return mutation.document._id;
  throw new Error("Invalid mutation type");
}
function applyAll(current, mutation) {
  return mutation.reduce((doc, m) => {
    const res = applyDocumentMutation(doc, m);
    if (res.status === "error")
      throw new Error(res.message);
    return res.status === "noop" ? doc : res.after;
  }, current);
}
function applyDocumentMutation(document, mutation) {
  if (mutation.type === "create")
    return create(document, mutation);
  if (mutation.type === "createIfNotExists")
    return createIfNotExists(document, mutation);
  if (mutation.type === "delete")
    return del(document, mutation);
  if (mutation.type === "createOrReplace")
    return createOrReplace(document, mutation);
  if (mutation.type === "patch")
    return patch(document, mutation);
  throw new Error(`Invalid mutation type: ${mutation.type}`);
}
function create(document, mutation) {
  if (document)
    return { status: "error", message: "Document already exist" };
  const result = assignId(mutation.document, nanoid);
  return { status: "created", id: result._id, after: result };
}
function createIfNotExists(document, mutation) {
  return hasId(mutation.document) ? document ? { status: "noop" } : { status: "created", id: mutation.document._id, after: mutation.document } : {
    status: "error",
    message: "Cannot createIfNotExists on document without _id"
  };
}
function createOrReplace(document, mutation) {
  return hasId(mutation.document) ? document ? {
    status: "updated",
    id: mutation.document._id,
    before: document,
    after: mutation.document
  } : { status: "created", id: mutation.document._id, after: mutation.document } : {
    status: "error",
    message: "Cannot createIfNotExists on document without _id"
  };
}
function del(document, mutation) {
  return document ? mutation.id !== document._id ? { status: "error", message: "Delete mutation targeted wrong document" } : {
    status: "deleted",
    id: mutation.id,
    before: document,
    after: void 0
  } : { status: "noop" };
}
function patch(document, mutation) {
  if (!document)
    return {
      status: "error",
      message: "Cannot apply patch on nonexistent document"
    };
  const next = applyPatchMutation(mutation, document);
  return document === next ? { status: "noop" } : { status: "updated", id: mutation.id, before: document, after: next };
}
function applyMutations(mutations, documentMap, transactionId) {
  const updatedDocs = /* @__PURE__ */ Object.create(null);
  for (const mutation of mutations) {
    const documentId = getMutationDocumentId(mutation);
    if (!documentId)
      throw new Error("Unable to get document id from mutation");
    const before = updatedDocs[documentId]?.after || documentMap.get(documentId), res = applyDocumentMutation(before, mutation);
    if (res.status === "error")
      throw new Error(res.message);
    res.status !== "noop" && (res.status === "updated" || res.status === "created" || res.status === "deleted") && (documentId in updatedDocs || (updatedDocs[documentId] = { before, after: void 0, muts: [] }), transactionId && (res.after._rev = transactionId), documentMap.set(documentId, res.after), updatedDocs[documentId].after = res.after, updatedDocs[documentId].muts.push(mutation));
  }
  return Object.entries(updatedDocs).map(([id, { before, after, muts }]) => ({
    id,
    status: after ? before ? "updated" : "created" : "deleted",
    mutations: muts,
    before,
    after
  }));
}
function takeUntilRight(arr, predicate, opts) {
  const result = [];
  for (const item of arr.slice().reverse()) {
    if (predicate(item))
      return result;
    result.push(item);
  }
  return result.reverse();
}
function isEqualPath(p1, p2) {
  return stringify(p1) === stringify(p2);
}
function supersedes(later, earlier) {
  return (earlier.type === "set" || earlier.type === "unset") && (later.type === "set" || later.type === "unset");
}
function squashNodePatches(patches) {
  return compactSetIfMissingPatches(
    compactSetPatches(compactUnsetPatches(patches))
  );
}
function compactUnsetPatches(patches) {
  return patches.reduce(
    (earlierPatches, laterPatch) => {
      if (laterPatch.op.type !== "unset")
        return earlierPatches.push(laterPatch), earlierPatches;
      const unaffected = earlierPatches.filter(
        (earlierPatch) => !startsWith(laterPatch.path, earlierPatch.path)
      );
      return unaffected.push(laterPatch), unaffected;
    },
    []
  );
}
function compactSetPatches(patches) {
  return patches.reduceRight(
    (laterPatches, earlierPatch) => (laterPatches.find(
      (later) => supersedes(later.op, earlierPatch.op) && isEqualPath(later.path, earlierPatch.path)
    ) || laterPatches.unshift(earlierPatch), laterPatches),
    []
  );
}
function compactSetIfMissingPatches(patches) {
  return patches.reduce(
    (previousPatches, laterPatch) => laterPatch.op.type !== "setIfMissing" ? (previousPatches.push(laterPatch), previousPatches) : (takeUntilRight(
      previousPatches,
      (patch2) => patch2.op.type === "unset"
    ).find(
      (precedingPatch) => precedingPatch.op.type === "setIfMissing" && isEqualPath(precedingPatch.path, laterPatch.path)
    ) || previousPatches.push(laterPatch), previousPatches),
    []
  );
}
function compactDMPSetPatches(base, patches) {
  let edge = base;
  return patches.reduce((previousPatches, patch2) => {
    const before = edge;
    if (edge = applyNodePatch(patch2, edge), patch2.op.type === "set" && typeof patch2.op.value == "string") {
      const current = getAtPath(patch2.path, before);
      if (typeof current == "string") {
        const replaced = {
          ...patch2,
          op: {
            type: "diffMatchPatch",
            value: stringifyPatches(makePatches(current, patch2.op.value))
          }
        };
        return previousPatches.flatMap((ep) => isEqualPath(ep.path, patch2.path) && ep.op.type === "diffMatchPatch" ? [] : ep).concat(replaced);
      }
    }
    return previousPatches.push(patch2), previousPatches;
  }, []);
}
function squashDMPStrings(base, mutationGroups) {
  return mutationGroups.map((mutationGroup) => ({
    ...mutationGroup,
    mutations: dmpIfyMutations(base, mutationGroup.mutations)
  }));
}
function dmpIfyMutations(store, mutations) {
  return mutations.map((mutation, i) => {
    if (mutation.type !== "patch")
      return mutation;
    const base = store.get(mutation.id);
    return base ? dmpifyPatchMutation(base, mutation) : mutation;
  });
}
function dmpifyPatchMutation(base, mutation) {
  return {
    ...mutation,
    patches: compactDMPSetPatches(base, mutation.patches)
  };
}
function mergeMutationGroups(mutationGroups) {
  return chunkWhile(mutationGroups, (group) => !group.transaction).flatMap(
    (chunk) => ({
      ...chunk[0],
      mutations: chunk.flatMap((c) => c.mutations)
    })
  );
}
function chunkWhile(arr, predicate) {
  const res = [];
  let currentChunk = [];
  return arr.forEach((item) => {
    predicate(item) ? currentChunk.push(item) : (currentChunk.length > 0 && res.push(currentChunk), currentChunk = [], res.push([item]));
  }), currentChunk.length > 0 && res.push(currentChunk), res;
}
function squashMutationGroups(staged) {
  return mergeMutationGroups(staged).map((transaction) => ({
    ...transaction,
    mutations: squashMutations(transaction.mutations)
  })).map((transaction) => ({
    ...transaction,
    mutations: transaction.mutations.map((mutation) => mutation.type !== "patch" ? mutation : {
      ...mutation,
      patches: squashNodePatches(mutation.patches)
    })
  }));
}
function squashMutations(mutations) {
  const byDocument = groupBy(mutations, getMutationDocumentId);
  return Object.values(byDocument).flatMap((documentMutations) => squashCreateIfNotExists(squashDelete(documentMutations)).flat().reduce((acc, docMutation) => {
    const prev = acc[acc.length - 1];
    return (!prev || prev.type === "patch") && docMutation.type === "patch" ? acc.slice(0, -1).concat({
      ...docMutation,
      patches: (prev?.patches || []).concat(docMutation.patches)
    }) : acc.concat(docMutation);
  }, []));
}
function squashCreateIfNotExists(mutations) {
  return mutations.length === 0 ? mutations : mutations.reduce((previousMuts, laterMut) => laterMut.type !== "createIfNotExists" ? (previousMuts.push(laterMut), previousMuts) : (takeUntilRight(previousMuts, (m) => m.type === "delete").find(
    (precedingPatch) => precedingPatch.type === "createIfNotExists"
  ) || previousMuts.push(laterMut), previousMuts), []);
}
function squashDelete(mutations) {
  return mutations.length === 0 ? mutations : mutations.reduce((previousMuts, laterMut) => laterMut.type === "delete" ? [laterMut] : (previousMuts.push(laterMut), previousMuts), []);
}
function rebase(documentId, oldBase, newBase, localMutations) {
  let edge = oldBase;
  const dmpified = localMutations.map((transaction) => {
    const mutations = transaction.mutations.flatMap((mut) => {
      if (getMutationDocumentId(mut) !== documentId)
        return [];
      const before = edge;
      return edge = applyAll(edge, [mut]), !before || mut.type !== "patch" ? mut : {
        type: "dmpified",
        mutation: {
          ...mut,
          // Todo: make compactDMPSetPatches return pairs of patches that was dmpified with their
          //  original as dmpPatches and original is not 1:1 (e..g some of the original may not be dmpified)
          dmpPatches: compactDMPSetPatches(before, mut.patches),
          original: mut.patches
        }
      };
    });
    return { ...transaction, mutations };
  });
  let newBaseWithDMPForOldBaseApplied = newBase;
  return dmpified.map((transaction) => {
    const applied = [];
    return transaction.mutations.forEach((mut) => {
      if (mut.type === "dmpified")
        try {
          newBaseWithDMPForOldBaseApplied = applyPatches(
            mut.mutation.dmpPatches,
            newBaseWithDMPForOldBaseApplied
          ), applied.push(mut);
        } catch {
          console.warn("Failed to apply dmp patch, falling back to original");
          try {
            newBaseWithDMPForOldBaseApplied = applyPatches(
              mut.mutation.original,
              newBaseWithDMPForOldBaseApplied
            ), applied.push(mut);
          } catch (second) {
            throw new Error(
              `Failed to apply patch for document "${documentId}": ${second.message}`,
              { cause: second }
            );
          }
        }
      else
        newBaseWithDMPForOldBaseApplied = applyAll(
          newBaseWithDMPForOldBaseApplied,
          [mut]
        );
    });
  }), [localMutations.map((transaction) => ({
    ...transaction,
    mutations: transaction.mutations.map((mut) => mut.type !== "patch" || getMutationDocumentId(mut) !== documentId ? mut : {
      ...mut,
      patches: mut.patches.map((patch2) => patch2.op.type !== "set" ? patch2 : {
        ...patch2,
        op: {
          ...patch2.op,
          value: getAtPath(patch2.path, newBaseWithDMPForOldBaseApplied)
        }
      })
    })
  })), newBaseWithDMPForOldBaseApplied];
}
function createTransactionId() {
  return uuid();
}
function toTransactions(groups) {
  return groups.map((group) => group.transaction && group.id !== void 0 ? { id: group.id, mutations: group.mutations } : { id: createTransactionId(), mutations: group.mutations });
}
export {
  applyAll,
  applyMutations,
  createTransactionId,
  getMutationDocumentId,
  rebase,
  squashDMPStrings,
  squashMutationGroups,
  toTransactions
};
//# sourceMappingURL=toTransactions.js.map

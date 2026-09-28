import { $ as PathElement, A as SafePath, B as Try, C as ParseInnerExpression, D as ParseProperty, E as ParseObject, F as ToArray, G as AnyEmptyArray, H as Get, I as ToNumber, J as FindBy, K as ByIndex, L as Trim, M as SplitAll, N as StringToPath, O as ParseValue, P as StripError, Q as Path, R as TrimLeft, S as ParseExpressions, T as ParseNumber, U as GetAtPath, V as Unwrap, W as getAtPath, X as Index, Y as FindInArray, Z as KeyedPathElement, _ as MergeInner, a as isKeyElement, b as ParseAllProps, c as startsWith, d as parse, et as PropertyName, f as Concat, g as Merge, h as Err, i as isIndexElement, j as Split, k as Result, l as normalize, m as Digit, n as isElementEqual, o as isKeyedElement, p as ConcatInner, q as ElementType, r as isEqual, s as isPropertyElement, st as Optional, t as isArrayElement, tt as AnyArray, u as stringify, v as Ok, w as ParseKVPair, x as ParseError, y as OnlyDigits, z as TrimRight } from "./_chunks-dts/index.js";
import { A as StringOp, C as Operation, D as ReplaceOp, E as RemoveOp, M as UnassignOp, N as UnsetOp, O as SetIfMissingOp, P as UpsertOp, S as ObjectOp, T as RelativePosition, _ as DiffMatchPatchOp, b as InsertOp, c as NodePatchList, d as SanityDocumentBase, f as Transaction, g as DecOp, h as AssignOp, i as DeleteMutation, j as TruncateOp, k as SetOp, l as PatchMutation, m as ArrayOp, n as CreateMutation, o as Mutation, p as AnyOp, r as CreateOrReplaceMutation, s as NodePatch, t as CreateIfNotExistsMutation, u as PatchOptions, v as IncOp, w as PrimitiveOp, x as NumberOp, y as InsertIfMissingOp } from "./_chunks-dts/types.js";
import { $ as MutationGroup, U as toTransactions, W as DocumentMap, at as RemoteDocumentEvent, ct as SubmitResult, et as MutationResult, lt as TransactionalMutationGroup, nt as OptimisticDocumentEvent, ot as RemoteMutationEvent, st as RemoteSyncEvent, tt as NonTransactionalMutationGroup } from "./_chunks-dts/index2.js";
import { RawPatch, RawPatch as RawPatch$1 } from "mendoza";
import { MutationEvent, ReconnectEvent, SanityClient, SanityDocument, WelcomeEvent } from "@sanity/client";
interface UpdateResult<T extends SanityDocumentBase> {
  id: string;
  status: 'created' | 'updated' | 'deleted';
  before?: T;
  after?: T;
  mutations: Mutation[];
}
/**
 * Takes a list of mutations and applies them to documents in a documentMap
 */
declare function applyMutations<T extends SanityDocumentBase>(mutations: Mutation[], documentMap: DocumentMap<T>,
/**
 * note: should never be set client side – only for test purposes
 */

transactionId?: never): UpdateResult<T>[];
declare function commit<Doc extends SanityDocumentBase>(results: UpdateResult<Doc>[], documentMap: DocumentMap<Doc>): void;
interface DataStore {
  get: (id: string) => SanityDocumentBase | undefined;
}
declare function squashDMPStrings(base: DataStore, mutationGroups: MutationGroup[]): MutationGroup[];
declare function squashMutationGroups(staged: readonly MutationGroup[]): MutationGroup[];
declare function rebase(documentId: string, oldBase: SanityDocumentBase | undefined, newBase: SanityDocumentBase | undefined, localMutations: readonly MutationGroup[]): [newLocal: MutationGroup[], rebased: SanityDocumentBase | undefined];
/**
 * Creates a single, shared, listener EventSource that strems remote mutations, and notifies when it's online (welcome), offline (reconnect).
 */
declare function createSharedListener(client: SanityClient): import("rxjs").Observable<WelcomeEvent | ReconnectEvent | MutationEvent>;
interface DocumentMutatorMachineInput {
  id: string;
  client: SanityClient;
  /** A shared listener can be provided, if not it'll be created using `client.listen()` */
  sharedListener?: ReturnType<typeof createSharedListener>;
  cache?: Map<string, SanityDocument | null>;
}
type DocumentMutatorMachineParentEvent = {
  type: 'sync';
  id: string;
  document: SanityDocumentBase;
} | {
  type: 'mutation';
  id: string;
  effects: {
    apply: RawPatch$1;
  };
  previousRev: string;
  resultRev: string;
} | {
  type: 'rebased.local';
  id: string;
  document: SanityDocumentBase;
} | {
  type: 'rebased.remote';
  id: string;
  document: SanityDocumentBase;
} | {
  type: 'pristine';
  id: string;
};
declare const documentMutatorMachine: import("xstate").StateMachine<{
  client: SanityClient; /** A shared listener can be provided, if not it'll be created using `client.listen()` */
  sharedListener?: ReturnType<typeof createSharedListener>; /** The document id */
  id: string;
  cache?: Map<string, SanityDocument | null>;
  remote: SanityDocument | null | undefined;
  local: SanityDocument | null | undefined;
  mutationEvents: MutationEvent[];
  stagedChanges: MutationGroup[];
  stashedChanges: MutationGroup[];
  error: unknown;
  fetchRemoteSnapshotAttempts: number;
  submitTransactionsAttempts: number;
}, import("@sanity/client").WelcomeEvent | import("@sanity/client").ReconnectEvent | MutationEvent | {
  type: "error";
} | {
  type: "retry";
} | {
  type: "connect";
} | {
  type: "reconnect";
} | {
  type: "welcome";
} | {
  type: "mutate";
  mutations: Mutation[];
} | {
  type: "submit";
} | {
  type: "xstate.done.actor.getDocument";
  output: SanityDocument;
} | {
  type: "xstate.done.actor.submitTransactions";
  output: undefined;
}, {
  [x: string]: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void | SanityDocument<Record<string, any>> | undefined, {
    client: SanityClient;
    id: string;
  }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, {
    client: SanityClient;
    transactions: Transaction[];
  }, import("xstate").EventObject>> | import("xstate").ActorRefFromLogic<import("xstate").ObservableActorLogic<import("@sanity/client").WelcomeEvent | import("@sanity/client").ReconnectEvent | MutationEvent, {
    listener: ReturnType<typeof createSharedListener>;
    id: string;
  }, import("xstate").EventObject>> | undefined;
  getDocument?: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void | SanityDocument<Record<string, any>> | undefined, {
    client: SanityClient;
    id: string;
  }, import("xstate").EventObject>> | undefined;
  submitTransactions?: import("xstate").ActorRefFromLogic<import("xstate").PromiseActorLogic<void, {
    client: SanityClient;
    transactions: Transaction[];
  }, import("xstate").EventObject>> | undefined;
}, {
  src: "fetch remote snapshot";
  logic: import("xstate").PromiseActorLogic<void | SanityDocument<Record<string, any>> | undefined, {
    client: SanityClient;
    id: string;
  }, import("xstate").EventObject>;
  id: "getDocument";
} | {
  src: "submit mutations as transactions";
  logic: import("xstate").PromiseActorLogic<void, {
    client: SanityClient;
    transactions: Transaction[];
  }, import("xstate").EventObject>;
  id: "submitTransactions";
} | {
  src: "server-sent events";
  logic: import("xstate").ObservableActorLogic<import("@sanity/client").WelcomeEvent | import("@sanity/client").ReconnectEvent | MutationEvent, {
    listener: ReturnType<typeof createSharedListener>;
    id: string;
  }, import("xstate").EventObject>;
  id: string | undefined;
}, {
  type: "assign error to context";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "clear error from context";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "connect to server-sent events";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "listen to server-sent events";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "stop listening to server-sent events";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "buffer remote mutation events";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "restore stashed changes";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "rebase fetched remote snapshot";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "apply mendoza patch";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "increment fetch attempts";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "reset fetch attempts";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "increment submit attempts";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "reset submit attempts";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "stage mutation";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "stash mutation";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "rebase local snapshot";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "send pristine event to parent";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "send sync event to parent";
  params: import("xstate").NonReducibleUnknown;
} | {
  type: "send mutation event to parent";
  params: import("xstate").NonReducibleUnknown;
}, never, "fetchRemoteSnapshotTimeout" | "submitTransactionsTimeout", "disconnected" | "connecting" | "reconnecting" | "connectFailure" | {
  connected: "loading" | "loadFailure" | {
    loaded: "pristine" | "dirty" | "submitting" | "submitFailure";
  };
}, "busy" | "error" | "ready", DocumentMutatorMachineInput, import("xstate").NonReducibleUnknown, import("xstate").EventObject, import("xstate").MetaObject, {
  id: "document-mutator";
  states: {
    readonly disconnected: {};
    readonly connecting: {};
    readonly connectFailure: {};
    readonly reconnecting: {};
    readonly connected: {
      states: {
        readonly loading: {};
        readonly loaded: {
          states: {
            readonly pristine: {};
            readonly dirty: {};
            readonly submitting: {};
            readonly submitFailure: {};
          };
        };
        readonly loadFailure: {};
      };
    };
  };
}>;
export { type AnyArray, type AnyEmptyArray, type AnyOp, type ArrayOp, type AssignOp, type ByIndex, type Concat, type ConcatInner, type CreateIfNotExistsMutation, type CreateMutation, type CreateOrReplaceMutation, type DataStore, type DecOp, type DeleteMutation, type DiffMatchPatchOp, type Digit, type DocumentMap, DocumentMutatorMachineInput, DocumentMutatorMachineParentEvent, type ElementType, type Err, type FindBy, type FindInArray, type Get, type GetAtPath, type IncOp, type Index, type InsertIfMissingOp, type InsertOp, type KeyedPathElement, type Merge, type MergeInner, type Mutation, type MutationGroup, type MutationResult, type NodePatch, type NodePatchList, type NonTransactionalMutationGroup, type NumberOp, type ObjectOp, type Ok, type OnlyDigits, type Operation, type OptimisticDocumentEvent, type Optional, type ParseAllProps, type ParseError, type ParseExpressions, type ParseInnerExpression, type ParseKVPair, type ParseNumber, type ParseObject, type ParseProperty, type ParseValue, type PatchMutation, type PatchOptions, type Path, type PathElement, type PrimitiveOp, type PropertyName, type RawPatch, type RelativePosition, type RemoteDocumentEvent, type RemoteMutationEvent, type RemoteSyncEvent, type RemoveOp, type ReplaceOp, type Result, type SafePath, type SanityDocumentBase, type SetIfMissingOp, type SetOp, type Split, type SplitAll, type StringOp, type StringToPath, type StripError, type SubmitResult, type ToArray, type ToNumber, type Transaction, type TransactionalMutationGroup, type Trim, type TrimLeft, type TrimRight, type TruncateOp, type Try, type UnassignOp, type UnsetOp, type Unwrap, type UpdateResult, type UpsertOp, applyMutations, commit, createSharedListener, documentMutatorMachine, type getAtPath, type isArrayElement, type isElementEqual, type isEqual, type isIndexElement, type isKeyElement, type isKeyedElement, type isPropertyElement, type normalize, type parse, rebase, squashDMPStrings, squashMutationGroups, type startsWith, type stringify, toTransactions };
//# sourceMappingURL=_unstable_machine.d.ts.map
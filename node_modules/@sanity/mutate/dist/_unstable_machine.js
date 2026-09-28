import { applyMutations, rebase, toTransactions, squashDMPStrings, squashMutationGroups } from "./_chunks-es/toTransactions.js";
import { applyPatch } from "mendoza";
import { share, filter, merge, shareReplay, defer, observeOn, asapScheduler } from "rxjs";
import { setup, fromPromise, fromEventObservable, sendParent, assertEvent, enqueueActions, assign, stopChild, spawnChild, raise } from "xstate";
import { encodeTransaction } from "./_chunks-es/encode.js";
import "./_chunks-es/utils.js";
function commit(results, documentMap) {
  results.forEach((result) => {
    (result.status === "created" || result.status === "updated") && documentMap.set(result.id, result.after), result.status === "deleted" && documentMap.delete(result.id);
  });
}
function createSharedListener(client) {
  const allEvents$ = client.listen(
    '*[!(_id in path("_.**"))]',
    {},
    {
      events: ["welcome", "mutation", "reconnect"],
      includeResult: !1,
      includePreviousRevision: !1,
      visibility: "transaction",
      effectFormat: "mendoza",
      includeMutations: !1
    }
  ).pipe(share({ resetOnRefCountZero: !0 })), reconnect = allEvents$.pipe(
    filter((event) => event.type === "reconnect")
  ), welcome = allEvents$.pipe(
    filter((event) => event.type === "welcome")
  ), mutations = allEvents$.pipe(
    filter((event) => event.type === "mutation")
  ), replayWelcome = merge(welcome, reconnect).pipe(
    shareReplay({ bufferSize: 1, refCount: !0 })
  ).pipe(
    filter((latestConnectionEvent) => latestConnectionEvent.type === "welcome")
  );
  return merge(replayWelcome, mutations, reconnect);
}
const documentMutatorMachine = setup({
  types: {},
  actions: {
    "assign error to context": assign({ error: ({ event }) => event }),
    "clear error from context": assign({ error: void 0 }),
    "connect to server-sent events": raise({ type: "connect" }),
    "listen to server-sent events": spawnChild("server-sent events", {
      id: "listener",
      input: ({ context }) => ({
        listener: context.sharedListener || createSharedListener(context.client),
        id: context.id
      })
    }),
    "stop listening to server-sent events": stopChild("listener"),
    "buffer remote mutation events": assign({
      mutationEvents: ({ event, context }) => (assertEvent(event, "mutation"), [...context.mutationEvents, event])
    }),
    "restore stashed changes": assign({
      stagedChanges: ({ event, context }) => (assertEvent(event, "xstate.done.actor.submitTransactions"), context.stashedChanges),
      stashedChanges: []
    }),
    "rebase fetched remote snapshot": enqueueActions(({ enqueue }) => {
      enqueue.assign(({ event, context }) => {
        assertEvent(event, "xstate.done.actor.getDocument");
        const previousRemote = context.remote;
        let nextRemote = event.output, seenCurrentRev = !1;
        for (const patch of context.mutationEvents)
          !patch.effects?.apply || !patch.previousRev && patch.transition !== "appear" || (!seenCurrentRev && patch.previousRev === nextRemote?._rev && (seenCurrentRev = !0), seenCurrentRev && (nextRemote = applyMendozaPatch(
            nextRemote,
            patch.effects.apply,
            patch.resultRev
          )));
        context.cache && // If the shared cache don't have the document already we can just set it
        (!context.cache.has(context.id) || // But when it's in the cache, make sure it's necessary to update it
        context.cache.get(context.id)._rev !== nextRemote?._rev) && context.cache.set(context.id, nextRemote);
        const [stagedChanges, local] = rebase(
          context.id,
          // It's annoying to convert between null and undefined, reach consensus
          previousRemote === null ? void 0 : previousRemote,
          nextRemote === null ? void 0 : nextRemote,
          context.stagedChanges
        );
        return {
          remote: nextRemote,
          local,
          stagedChanges,
          // Since the snapshot handler applies all the patches they are no longer needed, allow GC
          mutationEvents: []
        };
      }), enqueue.sendParent(
        ({ context }) => ({
          type: "rebased.remote",
          id: context.id,
          document: context.remote
        })
      );
    }),
    "apply mendoza patch": assign(({ event, context }) => {
      assertEvent(event, "mutation");
      const previousRemote = context.remote;
      if (event.transactionId === previousRemote?._rev)
        return {};
      const nextRemote = applyMendozaPatch(
        previousRemote,
        event.effects.apply,
        event.resultRev
      );
      context.cache && // If the shared cache don't have the document already we can just set it
      (!context.cache.has(context.id) || // But when it's in the cache, make sure it's necessary to update it
      context.cache.get(context.id)._rev !== nextRemote?._rev) && context.cache.set(context.id, nextRemote);
      const [stagedChanges, local] = rebase(
        context.id,
        // It's annoying to convert between null and undefined, reach consensus
        previousRemote === null ? void 0 : previousRemote,
        nextRemote === null ? void 0 : nextRemote,
        context.stagedChanges
      );
      return {
        remote: nextRemote,
        local,
        stagedChanges
      };
    }),
    "increment fetch attempts": assign({
      fetchRemoteSnapshotAttempts: ({ context }) => context.fetchRemoteSnapshotAttempts + 1
    }),
    "reset fetch attempts": assign({
      fetchRemoteSnapshotAttempts: 0
    }),
    "increment submit attempts": assign({
      submitTransactionsAttempts: ({ context }) => context.submitTransactionsAttempts + 1
    }),
    "reset submit attempts": assign({
      submitTransactionsAttempts: 0
    }),
    "stage mutation": assign({
      stagedChanges: ({ event, context }) => (assertEvent(event, "mutate"), [
        ...context.stagedChanges,
        { transaction: !1, mutations: event.mutations }
      ])
    }),
    "stash mutation": assign({
      stashedChanges: ({ event, context }) => (assertEvent(event, "mutate"), [
        ...context.stashedChanges,
        { transaction: !1, mutations: event.mutations }
      ])
    }),
    "rebase local snapshot": enqueueActions(({ enqueue }) => {
      enqueue.assign({
        local: ({ event, context }) => {
          assertEvent(event, "mutate");
          const localDataset = /* @__PURE__ */ new Map();
          context.local && localDataset.set(context.id, context.local);
          const results = applyMutations(event.mutations, localDataset);
          return commit(results, localDataset), localDataset.get(context.id);
        }
      }), enqueue.sendParent(
        ({ context }) => ({
          type: "rebased.local",
          id: context.id,
          document: context.local
        })
      );
    }),
    "send pristine event to parent": sendParent(
      ({ context }) => ({
        type: "pristine",
        id: context.id
      })
    ),
    "send sync event to parent": sendParent(
      ({ context }) => ({
        type: "sync",
        id: context.id,
        document: context.remote
      })
    ),
    "send mutation event to parent": sendParent(({ context, event }) => (assertEvent(event, "mutation"), {
      type: "mutation",
      id: context.id,
      previousRev: event.previousRev,
      resultRev: event.resultRev,
      effects: event.effects
    }))
  },
  actors: {
    "server-sent events": fromEventObservable(
      ({
        input
      }) => {
        const { listener, id } = input;
        return defer(() => listener).pipe(
          filter(
            (event) => event.type === "welcome" || event.type === "reconnect" || event.type === "mutation" && event.documentId === id
          ),
          // This is necessary to avoid sync emitted events from `shareReplay` from happening before the actor is ready to receive them
          observeOn(asapScheduler)
        );
      }
    ),
    "fetch remote snapshot": fromPromise(
      async ({
        input,
        signal
      }) => {
        const { client, id } = input;
        return await client.getDocument(id, {
          signal
        }).catch((e) => {
          if (!(e instanceof Error && e.name === "AbortError"))
            throw e;
        });
      }
    ),
    "submit mutations as transactions": fromPromise(
      async ({
        input,
        signal
      }) => {
        const { client, transactions } = input;
        for (const transaction of transactions) {
          if (signal.aborted) return;
          await client.dataRequest("mutate", encodeTransaction(transaction), {
            visibility: "async",
            returnDocuments: !1,
            signal
          }).catch((e) => {
            if (!(e instanceof Error && e.name === "AbortError"))
              throw e;
          });
        }
      }
    )
  },
  delays: {
    // Exponential backoff delay function
    fetchRemoteSnapshotTimeout: ({ context }) => Math.pow(2, context.fetchRemoteSnapshotAttempts) * 1e3,
    submitTransactionsTimeout: ({ context }) => Math.pow(2, context.submitTransactionsAttempts) * 1e3
  }
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QQPYGMCuBbMA7ALgLRYb4CG+KATgMQnn5gDaADALqKgAOKsAlvj4pcnEAA9EADhYAWAHQA2GSwUBmAKwBOaQEZJkhQBoQAT0Q6ATAF8rx1JhwFipCtTkQ+sNMNxg0jCBpvXF9-Vg4kEB5+QWFRCQQLFhY5PQB2dRU1SQsdGSVjMwRlHTkWNM00nR1VKryKmzt0bDwielcqOWDQwVwoGgB3MAAbbxxw0WiBIRFIhPUKuQ1NVU0tTU0WFdVCxAt1dTlNhX2WdRltGUk061sQexandspO7r9e-qo-H3eJyKnYrNQPNJJollpVutNttdghVCo5MoTgoMpo8jIkqpGvdmo42i4Xl0fv4+H0aGAqFRqH9uLxpnE5ogFrCLFd5CtNBYFJkdOpuaosXcHnjnAw3G9-AAxMh8YYYL5BYn4GlROmA+KIFEs1R6ORpZYWHIXGR6bHC1qijpyL4Sj6DEZjZjsSZqmYaxK1ORcvlc-ZqSoyNKwnRpGTyK4WDK5BQ6BQ5BRm3EW55uG1K0n9ClUqgqgFuxketJe7nIv2rUNB0x7LmSL2qGMsSySevcmSJhzJgnipWQOgEma510M4HmcqHZYyWqaOMqTQyWGh0osVSGiwC5uGyftx74sWvHuBNMhX7O-5DoHiPae72lvnlwPBydFlRVS7qPIl7cilP74-+SByMMKBkB4ZKoL4cikgAbigADWYByDA+AACJJgQg4xPmI7FHkZQrKGsjqKcCiaMG9YpJOxySBiCiyPoX6dnuRJ-gEgHAaBmaUm4XDDBQABm1BYIhYAoWhyqnrSmHDpeCAKCicjUbU6g6nkFichYsJrLWVxaPsk7KdICZCmJlqEraAFASBvbPAOEmqlJF4JJURbVDcy4Yvk1GVkUsabApMjKZGqjNg2kgMU8Xa-j0FnsQBXBUJ4vRgH2DBOhEkn0o5TLKV6y6WDG6lhkYVYIDoKzyBkeR8pUDZqOFu5WuZEBsVZzUeFQ+AmDQsAYAARlgAgYZl7o6I2tYLJINSSO+3JaMGlQpGkhFhryo2jW2xkdhFTFNS1EAAT1-UCHa4EIdBcEIYdA34AAKlQZC4LAZAksIsBDeqBbrdpym8iuByxlcLK5BYqQLBUZyTcFvL1aZ3YsTFrVyFdx0ZuSXGdDx-GCUjfXXXdD1PS9j3vVhMnrWCFRxtNaRLdcfIsiwuS5fkgZaOUlhpDDP7MdFzWWftzXI-gdrPGlLoOSNyiHFstRySisjcgzahyFoUYBbRsac5tO6w1F7wIwLONHfg0qyvKyVfPgVAmCT0kJGt41pJD02xgcpElUkcZ6rI+q5JcckbU0W0NWZB57QduMCKbcoKmIsCpXIZB8YwVAABRC-jj3PYCsA3XwOAoKQACUNDmttjVh-zEfG9H5u21lpVjSrTtTTNbsstUYJJAFWgA37XORTz+t8+xtcKpb1v1+6KJFopGQqRi6nBlstYcqNK5riusYDztlejzKMfJXHCdJynqd8SJaAABYAEpgFgKCMAAyrgZBcLAV+P3nBfF6XJnc7tfmY8xZnglgWGe-klILzUhYDSJVRpnCONNOcWxWRKBRDYO4uAUD7XgJEMuIdqDi2GgWQgOhgxMyRKyFc8IuQkXUDvK0HgvAHmIR9bCD4SoeSWCoLkoZpxrmXIw0OLEMxsNJgkSc418KhnrHyG4oZYTcPhMifhJx4SCiDjrABSpgHiLtogAUhwW77DRIGXkk55wexKCrJQsg1jBTnPsYRqZviiL6PohuORgyhhBhGKMsZYzxhcXrf8EBPHulUJOPCtRlABWIu7IoORVBIIhMpNYGJyghKHmEvaYjQEkOwhkxQrJtBES0JDOBPlkgKD1JYZSjZORyTXNkwBsVwkFPYTJVYS58JxPKbOYM0gUj7FjGcEMOpciaJxMHXWOTWJV2avFRKpIwARILJRGJBF4mZBIkDE0KtIxLSSDkDYGhWl70Ru1Tq6zsLURBkoLyWRmz8PmlUZmcY1zXDKdMghcy2mIyFh8W5ZN4RFmOFyKaZwiLeT2GVJcy5pBrguCiMK2tvyDwBYbIWejOkSMQBkeQORJq0RNCUDIDNondxuGpPQmRqIXPhiPECuKMpdMkbILZ-SEnLxyjqOJMZsj1jRTYIAA */
  id: "document-mutator",
  context: ({ input }) => ({
    client: input.client.withConfig({ allowReconfigure: !1 }),
    sharedListener: input.sharedListener,
    id: input.id,
    remote: void 0,
    local: void 0,
    mutationEvents: [],
    stagedChanges: [],
    stashedChanges: [],
    error: void 0,
    fetchRemoteSnapshotAttempts: 0,
    submitTransactionsAttempts: 0,
    cache: input.cache
  }),
  // Auto start the connection by default
  entry: ["connect to server-sent events"],
  on: {
    mutate: {
      actions: ["rebase local snapshot", "stage mutation"]
    }
  },
  initial: "disconnected",
  states: {
    disconnected: {
      on: {
        connect: {
          target: "connecting",
          actions: ["listen to server-sent events"]
        }
      }
    },
    connecting: {
      on: {
        welcome: "connected",
        reconnect: "reconnecting",
        error: "connectFailure"
      },
      tags: ["busy"]
    },
    connectFailure: {
      on: {
        connect: {
          target: "connecting",
          actions: ["listen to server-sent events"]
        }
      },
      entry: [
        "stop listening to server-sent events",
        "assign error to context"
      ],
      exit: ["clear error from context"],
      tags: ["error"]
    },
    reconnecting: {
      on: {
        welcome: {
          target: "connected"
        },
        error: {
          target: "connectFailure"
        }
      },
      tags: ["busy", "error"]
    },
    connected: {
      on: {
        mutation: {
          actions: ["buffer remote mutation events"]
        },
        reconnect: "reconnecting"
      },
      entry: ["clear error from context"],
      initial: "loading",
      states: {
        loading: {
          invoke: {
            src: "fetch remote snapshot",
            id: "getDocument",
            input: ({ context }) => ({
              client: context.client,
              id: context.id
            }),
            onError: {
              target: "loadFailure"
            },
            onDone: {
              target: "loaded",
              actions: [
                "rebase fetched remote snapshot",
                "reset fetch attempts"
              ]
            }
          },
          tags: ["busy"]
        },
        loaded: {
          entry: ["send sync event to parent"],
          on: {
            mutation: {
              actions: ["apply mendoza patch", "send mutation event to parent"]
            }
          },
          initial: "pristine",
          states: {
            pristine: {
              on: {
                mutate: {
                  actions: ["rebase local snapshot", "stage mutation"],
                  target: "dirty"
                }
              },
              tags: ["ready"]
            },
            dirty: {
              on: {
                submit: "submitting"
              },
              tags: ["ready"]
            },
            submitting: {
              on: {
                mutate: {
                  actions: ["rebase local snapshot", "stash mutation"]
                }
              },
              invoke: {
                src: "submit mutations as transactions",
                id: "submitTransactions",
                input: ({ context }) => {
                  const remoteDataset = /* @__PURE__ */ new Map();
                  return remoteDataset.set(context.id, context.remote), {
                    client: context.client,
                    transactions: toTransactions(
                      // Squashing DMP strings is the last thing we do before submitting
                      squashDMPStrings(
                        remoteDataset,
                        squashMutationGroups(context.stagedChanges)
                      )
                    )
                  };
                },
                onError: {
                  target: "submitFailure"
                },
                onDone: {
                  target: "pristine",
                  actions: [
                    "restore stashed changes",
                    "reset submit attempts",
                    "send pristine event to parent"
                  ]
                }
              },
              /**
               * 'busy' means we should show a spinner, 'ready' means we can still accept mutations, they'll be applied optimistically right away, and queued for submissions after the current submission settles
               */
              tags: ["busy", "ready"]
            },
            submitFailure: {
              exit: ["clear error from context"],
              after: {
                submitTransactionsTimeout: {
                  actions: ["increment submit attempts"],
                  target: "submitting"
                }
              },
              on: {
                retry: "submitting"
              },
              /**
               * How can it be both `ready` and `error`? `ready` means it can receive mutations, optimistically apply them, and queue them for submission. `error` means it failed to submit previously applied mutations.
               * It's completely fine to keep queueing up more mutations and applying them optimistically, while showing UI that notifies that mutations didn't submit, and show a count down until the next automatic retry.
               */
              tags: ["error", "ready"]
            }
          }
        },
        loadFailure: {
          exit: ["clear error from context"],
          after: {
            fetchRemoteSnapshotTimeout: {
              actions: ["increment fetch attempts"],
              target: "loading"
            }
          },
          on: {
            retry: "loading"
          },
          tags: ["error"]
        }
      }
    }
  }
});
function applyMendozaPatch(document, patch, nextRevision) {
  const next = applyPatch(omitRev(document), patch);
  return next ? Object.assign(next, { _rev: nextRevision }) : null;
}
function omitRev(document) {
  if (!document)
    return null;
  const { _rev, ...doc } = document;
  return doc;
}
export {
  applyMutations,
  commit,
  createSharedListener,
  documentMutatorMachine,
  rebase,
  squashDMPStrings,
  squashMutationGroups,
  toTransactions
};
//# sourceMappingURL=_unstable_machine.js.map

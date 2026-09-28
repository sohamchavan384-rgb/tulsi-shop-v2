import type { FunctionResource, InvocationResponse, InvokeContextOptions, InvokeExecutionOptions, InvokePayloadOptions } from '../../types.js';
/**
 * Upper bound on nested `context.invoke` recursion, a backstop against invoke loops.
 * Set to 16 to match Functions service lineage limit.
 */
export declare const MAX_INVOKE_DEPTH = 16;
/**
 * Guard a nested `context.invoke(name)` against runaway recursion and cycles.
 * `depth` is the depth at which the target would run and `callStack` is the chain
 * of function names already running (innermost last). Throws a descriptive error
 * when the call must be rejected; returns normally when it is safe to proceed.
 *
 * This is an enqueue-time check: it runs before the target is dispatched, so the
 * throw propagates to the caller's `context.invoke` (unlike a downstream handler
 * error, which is fire-and-forget). See `handleNestedInvoke` in local.ts.
 */
export declare function assertNestedInvokeAllowed(name: string, depth: number, callStack: string[]): void;
/**
 * Execute a single already-resolved function in its own child process as one
 * step of an invoke chain: enforce the depth/cycle guard, run it with the call
 * stack extended by this function, and normalize timings.
 */
export declare function runFunction(resource: FunctionResource, payload: InvokePayloadOptions, context: InvokeContextOptions, options: InvokeExecutionOptions): Promise<InvocationResponse & {
    timings: Record<string, number>;
}>;

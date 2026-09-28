import invoke from './local.js';
/**
 * Upper bound on nested `context.invoke` recursion, a backstop against invoke loops.
 * Set to 16 to match Functions service lineage limit.
 */
export const MAX_INVOKE_DEPTH = 16;
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
export function assertNestedInvokeAllowed(name, depth, callStack) {
    if (depth > MAX_INVOKE_DEPTH) {
        throw new Error(`Maximum invoke depth (${MAX_INVOKE_DEPTH}) exceeded`);
    }
    if (callStack.includes(name)) {
        throw new Error(`Invoke cycle detected: ${[...callStack, name].join(' → ')}`);
    }
}
/**
 * Execute a single already-resolved function in its own child process as one
 * step of an invoke chain: enforce the depth/cycle guard, run it with the call
 * stack extended by this function, and normalize timings.
 */
export async function runFunction(resource, payload, context, options) {
    const { forceColor, timeout, depth = 0, callStack = [], onNestedInvoke } = options;
    assertNestedInvokeAllowed(resource.name, depth, callStack);
    const response = await invoke(resource, payload, context, {
        forceColor,
        timeout: timeout ?? resource.timeout,
        onNestedInvoke,
        depth,
        callStack: [...callStack, resource.name],
    });
    return { ...response, timings: response.timings ?? {} };
}

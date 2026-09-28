/**
 * Race a promise against a timeout, with proper cleanup of the timeout timer
 *
 * @param promise - The promise to race
 * @param timeout - Timeout in milliseconds
 * @returns The promise result, or null if timeout wins
 */ export async function promiseRaceWithTimeout(promise, timeout) {
    let timeoutId;
    try {
        const result = await Promise.race([
            promise,
            new Promise((resolve)=>{
                timeoutId = setTimeout(()=>resolve(null), timeout);
            })
        ]);
        // Clear timeout if promise won
        if (timeoutId && result !== null) {
            clearTimeout(timeoutId);
        }
        return result;
    } finally{
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
}

//# sourceMappingURL=promiseRaceWithTimeout.js.map
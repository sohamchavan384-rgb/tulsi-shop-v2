/**
 * Create a config in the provided config store that expires after the provided TTL.
 */ export function createExpiringConfig({ fetchValue, key, onCacheHit = ()=>null, onFetch = ()=>null, onRevalidate = ()=>null, store, ttl, validateValue = (_value)=>true }) {
    let currentFetch = null;
    return {
        delete () {
            store.delete(key);
        },
        async get () {
            const stored = store.get(key);
            if (isExpiringValue(stored)) {
                const { updatedAt, value } = stored;
                if (!validateValue(value)) {
                    throw new Error('Stored value is invalid');
                }
                const hasExpired = Date.now() - updatedAt > ttl;
                if (!hasExpired) {
                    onCacheHit();
                    return value;
                }
                onRevalidate();
            }
            // Return existing fetch if one is already in progress
            if (currentFetch) {
                return currentFetch;
            }
            onFetch();
            currentFetch = Promise.resolve(fetchValue());
            const nextValue = await currentFetch;
            if (!validateValue(nextValue)) {
                throw new Error('Fetched value is invalid');
            }
            currentFetch = null;
            store.set(key, {
                updatedAt: Date.now(),
                value: nextValue
            });
            return nextValue;
        }
    };
}
/**
 * Checks if the given stored value is valid (does not check if expired, only verified shape)
 *
 * @param stored - The stored value to check
 * @returns True if the stored value is valid
 * @internal
 */ function isExpiringValue(stored) {
    if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) {
        return false;
    }
    if (!('updatedAt' in stored) || typeof stored.updatedAt !== 'number') {
        return false;
    }
    if (!('value' in stored)) {
        return false;
    }
    return true;
}

//# sourceMappingURL=createExpiringConfig.js.map
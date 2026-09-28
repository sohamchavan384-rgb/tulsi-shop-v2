/**
 * `structuredClone()`, but doesn't throw on non-clonable values - instead it drops them.
 *
 * @param obj - The object to clone.
 * @returns The cloned object.
 * @internal
 */ export function safeStructuredClone(obj) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const seen = new WeakMap();
    function clone(value) {
        if (typeof value === 'function' || typeof value === 'symbol') {
            return undefined; // Drop non-clonable values
        }
        if (value !== null && typeof value === 'object') {
            if (seen.has(value)) return seen.get(value);
            if (value instanceof Date) return new Date(value);
            if (value instanceof RegExp) return new RegExp(value);
            if (value instanceof Set) return new Set([
                ...value
            ].map((item)=>clone(item)));
            if (value instanceof Map) return new Map([
                ...value.entries()
            ].map(([k, v])=>[
                    clone(k),
                    clone(v)
                ]));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (ArrayBuffer.isView(value)) return new value.constructor(value);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = Array.isArray(value) ? [] : {};
            seen.set(value, result);
            for(const key in value){
                const clonedValue = clone(value[key]);
                if (clonedValue !== undefined) result[key] = clonedValue;
            }
            return result;
        }
        return value;
    }
    return clone(obj);
}

//# sourceMappingURL=safeStructuredClone.js.map
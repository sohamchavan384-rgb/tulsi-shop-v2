import { typeid } from 'typeid-js';
/**
 * Creates a unique trace ID using typeid
 *
 * @internal
 */ export function createTraceId() {
    return typeid('trace').toString();
}

//# sourceMappingURL=createTraceId.js.map
export function isUnion(type) {
    return type.kind === 'Union';
}
export function isNonUnion(type) {
    return !isUnion(type) && 'type' in type;
}
export function isDocumentType(type) {
    return isNonUnion(type) && type.type === 'Object' && Array.isArray(type.interfaces) && type.interfaces.includes('Document');
}
/**
 * Strip `_internal` metadata from extracted types before sending to the API.
 * This property carries pipeline-internal data (e.g. deprecation info for query generation)
 * and must not be included in the deployed schema.
 */ export function stripInternalMeta(types) {
    return types.map((type)=>{
        if ('_internal' in type) {
            const { _internal, ...rest } = type;
            return rest;
        }
        return type;
    });
}

//# sourceMappingURL=helpers.js.map
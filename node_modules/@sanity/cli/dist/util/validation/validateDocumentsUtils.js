import { isReference } from '@sanity/types';
export const DOCUMENT_VALIDATION_TIMEOUT = 30_000;
export const MAX_VALIDATION_CONCURRENCY = 100;
export const REFERENCE_INTEGRITY_BATCH_SIZE = 100;
export const levelValues = {
    error: 0,
    info: 2,
    warning: 1
};
export const getReferenceIds = (value)=>{
    const ids = new Set();
    function traverse(node) {
        if (isReference(node)) {
            ids.add(node._ref);
            return;
        }
        if (typeof node === 'object' && node) {
            // Note: this works for arrays too
            for (const item of Object.values(node))traverse(item);
        }
    }
    traverse(value);
    return ids;
};
const idRegex = /^[^-][A-Z0-9._-]*$/i;
// during testing, the `doc` endpoint 502'ed if given an invalid ID
export const isValidId = (id)=>typeof id === 'string' && idRegex.test(id);
export const shouldIncludeDocument = (document)=>{
    // Filter out system documents and sanity documents
    return !document._type.startsWith('system.') && !document._type.startsWith('sanity.');
};

//# sourceMappingURL=validateDocumentsUtils.js.map
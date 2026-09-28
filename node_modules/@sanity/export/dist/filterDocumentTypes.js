import { throughObj } from './util/streamHelpers.js';
export function filterDocumentTypes(allowedTypes) {
    if (!allowedTypes || allowedTypes.length === 0) {
        // Pass-through
        return throughObj((doc, _enc, callback) => callback(null, doc));
    }
    return throughObj(function docTypesFilter(doc, _enc, callback) {
        const type = doc._type;
        if (allowedTypes.includes(type)) {
            callback(null, doc);
            return;
        }
        callback();
    });
}
//# sourceMappingURL=filterDocumentTypes.js.map
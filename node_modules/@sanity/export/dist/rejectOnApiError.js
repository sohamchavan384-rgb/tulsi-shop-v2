import { throughObj } from './util/streamHelpers.js';
function isErrorDocument(doc) {
    return !('_id' in doc && doc._id) && 'error' in doc;
}
export function rejectOnApiError() {
    return throughObj((doc, _enc, callback) => {
        // check if the document passed contains a document attribute first, and return early.
        if ('_id' in doc && doc._id) {
            callback(null, doc);
            return;
        }
        if (isErrorDocument(doc)) {
            // if we got a statusCode we can decorate the error with it
            if (doc.statusCode) {
                const err = doc.error;
                const errorMessage = typeof err === 'string'
                    ? err
                    : typeof err === 'object'
                        ? (err.description ?? err.message)
                        : undefined;
                callback(new Error(['Export', `HTTP ${doc.statusCode}`, errorMessage, doc.message]
                    .filter((part) => typeof part === 'string')
                    .join(': ')));
                return;
            }
            // no statusCode, just serialize and return the error
            const error = doc.error;
            const errorMessage = typeof error === 'object' ? (error.description ?? error.message) : undefined;
            callback(new Error(errorMessage ?? JSON.stringify(doc)));
            return;
        }
        callback(null, doc);
    });
}
//# sourceMappingURL=rejectOnApiError.js.map
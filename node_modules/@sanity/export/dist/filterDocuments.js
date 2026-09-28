import { throughObj } from './util/streamHelpers.js';
import { debug } from './debug.js';
const isDraftOrVersion = (doc) => Boolean(doc._id && (doc._id.indexOf('drafts.') === 0 || doc._id.indexOf('versions.') === 0));
const isSystemDocument = (doc) => Boolean(doc._id && doc._id.indexOf('_.') === 0);
const isReleaseDocument = (doc) => Boolean(doc._id && doc._id.indexOf('_.releases.') === 0);
const isCursor = (doc) => typeof doc === 'object' &&
    doc !== null &&
    !('_id' in doc) &&
    'nextCursor' in doc &&
    doc.nextCursor !== undefined;
export function filterDocuments(drafts) {
    return throughObj(function filterDocs(doc, _enc, callback) {
        if (isCursor(doc)) {
            debug('%o is a cursor, skipping', doc);
            callback();
            return;
        }
        const sanityDoc = doc;
        if (!drafts && isDraftOrVersion(sanityDoc)) {
            debug('%s is a draft or version, skipping', sanityDoc._id);
            callback();
            return;
        }
        if (isSystemDocument(sanityDoc)) {
            if (drafts && isReleaseDocument(sanityDoc)) {
                callback(null, sanityDoc);
                return;
            }
            debug('%s is a system document, skipping', sanityDoc._id);
            callback();
            return;
        }
        callback(null, sanityDoc);
    });
}
//# sourceMappingURL=filterDocuments.js.map
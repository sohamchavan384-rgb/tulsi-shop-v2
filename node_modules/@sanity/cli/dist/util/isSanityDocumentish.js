/**
 * Checks if a document is a Sanity document
 * @param doc - The document to check
 * @returns True if the document is a Sanity document, false otherwise
 *
 * @internal
 */ export function isSanityDocumentish(doc) {
    return doc !== null && typeof doc === 'object' && '_type' in doc && typeof doc._type === 'string';
}
/**
 * Checks if a document is a Sanity document with an _id
 * @param doc - The document to check
 * @returns True if the document is a Sanity document with an _id, false otherwise
 *
 * @internal
 */ export function isIdentifiedSanityDocument(doc) {
    return isSanityDocumentish(doc) && '_id' in doc;
}

//# sourceMappingURL=isSanityDocumentish.js.map
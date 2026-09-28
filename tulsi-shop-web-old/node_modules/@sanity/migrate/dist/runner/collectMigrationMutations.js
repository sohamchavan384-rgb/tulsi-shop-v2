import { normalizeMigrateDefinition } from './normalizeMigrateDefinition.js';
function wrapDocumentsIteratorProducer(factory) {
    function documents() {
        return factory();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to dynamically add Symbol property to function
    ;
    documents[Symbol.asyncIterator] = function() {
        throw new Error('The migration is attempting to iterate over the "documents" function, please call the function instead:\n\n      // BAD:\n      for await (const document of documents) {\n        // ...\n      }\n\n      // GOOD:                        \uD83D\uDC47 This is a function and has to be called\n      for await (const document of documents()) {\n        // ...\n      }\n      ');
    };
    return documents;
}
/**
 * @public
 */ export function collectMigrationMutations(migration, documents, context) {
    var migrate = normalizeMigrateDefinition(migration);
    return migrate(wrapDocumentsIteratorProducer(documents), context);
}

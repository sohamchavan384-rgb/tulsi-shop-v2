import readline from 'node:readline';
/**
 * Stream an NDJSON file and build a Map from a key field to a value field.
 *
 * Only entries that contain the key field are indexed. If duplicate keys exist,
 * the last entry wins.
 *
 * @internal
 */ export async function buildNdjsonIndex(ndjson, keyField, valueField) {
    const lines = readline.createInterface({
        input: ndjson
    });
    const index = new Map();
    try {
        for await (const line of lines){
            const trimmed = line.trim();
            if (trimmed) {
                const entry = JSON.parse(trimmed);
                if (entry[keyField] != null) {
                    index.set(entry[keyField], entry[valueField]);
                }
            }
        }
    } finally{
        lines.close();
        // Explicitly destroy the underlying stream to prevent file descriptor leaks
        ndjson.destroy();
    }
    return index;
}

//# sourceMappingURL=buildNdjsonIndex.js.map
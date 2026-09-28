/** Converts serialized schema debug data to ESBuild metafile format */ export function generateMetafile(schema) {
    const output = {
        bytes: 0,
        exports: [],
        imports: [],
        inputs: {}
    };
    // Generate a esbuild metafile
    const inputs = {};
    function processType(path, entry) {
        let childSize = 0;
        if (entry.fields) {
            for (const [name, fieldEntry] of Object.entries(entry.fields)){
                processType(`${path}/${name}`, fieldEntry);
                childSize += fieldEntry.size;
            }
        }
        if (entry.of) {
            for (const [name, fieldEntry] of Object.entries(entry.of)){
                processType(`${path}/${name}`, fieldEntry);
                childSize += fieldEntry.size;
            }
        }
        const selfSize = entry.size - childSize;
        inputs[path] = {
            bytes: selfSize,
            format: 'esm',
            imports: []
        };
        output.inputs[path] = {
            bytesInOutput: selfSize
        };
        output.bytes += selfSize;
    }
    for (const [name, entry] of Object.entries(schema.types)){
        const fakePath = `schema/${entry.extends}/${name}`;
        processType(fakePath, entry);
    }
    for (const [name, entry] of Object.entries(schema.hoisted)){
        const fakePath = `hoisted/${name}`;
        processType(fakePath, entry);
    }
    return {
        inputs,
        outputs: {
            root: output
        }
    };
}

//# sourceMappingURL=metafile.js.map
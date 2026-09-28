import { Transform } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
export function through(transformFn) {
    return new Transform({
        transform(chunk, encoding, callback) {
            transformFn(chunk, encoding, callback);
        },
    });
}
export function throughObj(transformFn) {
    return new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
            transformFn(chunk, encoding, callback);
        },
    });
}
export function isWritableStream(val) {
    return (val !== null &&
        typeof val === 'object' &&
        'pipe' in val &&
        typeof val.pipe === 'function' &&
        '_write' in val &&
        typeof val._write === 'function' &&
        '_writableState' in val &&
        typeof val._writableState === 'object');
}
export function concat(onData) {
    const chunks = [];
    return new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
            chunks.push(chunk);
            callback();
        },
        flush(callback) {
            try {
                onData(chunks);
                callback();
            }
            catch (err) {
                callback(err);
            }
        },
    });
}
export function split(transformFn) {
    let buffer = '';
    const splitRegex = /\r?\n/;
    const decoder = new StringDecoder('utf8');
    return new Transform({
        objectMode: Boolean(transformFn),
        transform(chunk, _encoding, callback) {
            buffer += decoder.write(chunk);
            const lines = buffer.split(splitRegex);
            // Keep the last line in buffer as it might be incomplete
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (line.length === 0)
                    continue;
                if (transformFn) {
                    try {
                        const result = transformFn(line);
                        if (result !== undefined) {
                            this.push(result);
                        }
                    }
                    catch (err) {
                        callback(err);
                        return;
                    }
                }
                else {
                    this.push(line);
                }
            }
            callback();
        },
        flush(callback) {
            // Flush any remaining bytes from the decoder
            buffer += decoder.end();
            if (buffer.length === 0) {
                callback();
                return;
            }
            if (!transformFn) {
                callback(null, buffer);
                return;
            }
            try {
                const result = transformFn(buffer);
                if (result !== undefined) {
                    this.push(result);
                }
                callback();
            }
            catch (err) {
                callback(err);
            }
        },
    });
}
//# sourceMappingURL=streamHelpers.js.map
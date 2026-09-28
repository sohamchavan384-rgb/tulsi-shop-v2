import { throughObj } from './util/streamHelpers.js';
export function stringifyStream() {
    return throughObj((doc, _enc, callback) => callback(null, `${JSON.stringify(doc)}\n`));
}
//# sourceMappingURL=stringifyStream.js.map
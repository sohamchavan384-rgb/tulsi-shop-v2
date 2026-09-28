import { isRecord } from './is-record.js';
export function parseJsonObject(jsonString) {
    try {
        const o = JSON.parse(jsonString);
        return isRecord(o) ? o : null;
    }
    catch {
        return null;
    }
}

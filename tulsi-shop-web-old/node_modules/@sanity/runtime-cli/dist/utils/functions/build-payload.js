import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { parseJsonObject } from '../parse-json-object.js';
export default function buildPayload(options) {
    const { data, file } = options;
    let payload = {};
    if (data) {
        payload = parseJsonObject(data);
        if (!payload)
            throw new Error('The data flag must be set to a valid JSON object.');
    }
    else if (file) {
        const fileContents = readFileSync(join(cwd(), file), 'utf8');
        payload = parseJsonObject(fileContents);
        if (!payload)
            throw new Error(`${file} must contain a valid JSON object.`);
    }
    return payload;
}

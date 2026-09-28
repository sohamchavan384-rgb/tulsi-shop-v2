import { readFileSync } from 'node:fs';
/**
 * Read the file at the given path synchronously and parse it as JSON.
 *
 * @param filePath - Path to JSON file to read
 * @returns The parsed file
 * @internal
 */ export function readJsonFileSync(filePath) {
    let content;
    try {
        content = readFileSync(filePath, 'utf8');
    } catch (err) {
        throw new Error(`Failed to read "${filePath}"`, {
            cause: err
        });
    }
    try {
        return JSON.parse(content);
    } catch (err) {
        throw new Error(`Failed to parse "${filePath}" as JSON`, {
            cause: err
        });
    }
}

//# sourceMappingURL=readJsonFileSync.js.map
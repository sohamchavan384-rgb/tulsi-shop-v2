import { readFile } from 'node:fs/promises';
/**
 * Read the file at the given path and parse it as JSON.
 *
 * @param filePath - Path to JSON file to read
 * @returns The parsed file
 * @internal
 */ export async function readJsonFile(filePath) {
    let content;
    try {
        content = await readFile(filePath, 'utf8');
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

//# sourceMappingURL=readJsonFile.js.map
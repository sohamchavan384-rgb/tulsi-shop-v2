import fs from 'node:fs/promises';
/**
 * Reads and parses a JSON file, returning null if the file doesn't exist
 * or contains invalid JSON.
 */ export async function readJsonFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return JSON.parse(content);
    } catch  {
        return null;
    }
}

//# sourceMappingURL=readJsonFile.js.map
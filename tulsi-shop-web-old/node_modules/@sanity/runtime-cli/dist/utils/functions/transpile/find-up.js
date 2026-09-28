import { access } from 'node:fs/promises';
import path from 'node:path';
/**
 * Walks up the directory tree from a starting point to find a given file/directory.
 *
 * @param fileName - The name of the file/directory to find.
 * @param startDir - The directory to start searching from (default is the current working directory).
 * @returns The path to the file if found, otherwise undefined.
 */
export async function findUp(fileName, startDir = process.cwd()) {
    let dir = path.resolve(startDir);
    while (true) {
        const candidate = path.join(dir, fileName);
        try {
            await access(candidate);
            return candidate;
        }
        catch {
            const parent = path.dirname(dir);
            if (parent === dir)
                break; // Reached root
            dir = parent;
        }
    }
    return undefined;
}
/**
 * Finds the directory containing a specific file/directory by walking up the directory tree.
 *
 * @param fileName - The name of the file/directory to find.
 * @param startDir - The directory to start searching from (default is the current working directory).
 * @returns The directory containing the file if found, otherwise undefined.
 */
export async function findDirUp(fileName, startDir = process.cwd()) {
    const filePath = await findUp(fileName, startDir);
    if (!filePath)
        return undefined;
    return path.dirname(filePath);
}

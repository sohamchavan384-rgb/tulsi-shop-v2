import { readdir, stat } from 'node:fs/promises';
export async function dirIsEmptyOrNonExistent(sourceDir) {
    try {
        const stats = await stat(sourceDir);
        if (!stats.isDirectory()) {
            throw new Error(`Directory ${sourceDir} is not a directory`);
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            return true;
        }
        throw err;
    }
    const content = await readdir(sourceDir);
    return content.length === 0;
}

//# sourceMappingURL=dirIsEmptyOrNonExistent.js.map
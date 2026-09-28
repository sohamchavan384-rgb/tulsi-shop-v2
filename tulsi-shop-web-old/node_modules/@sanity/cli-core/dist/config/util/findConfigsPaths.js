import { join } from 'node:path';
import { fileExists } from '../../util/fileExists.js';
/**
 * Finds the path for a given set of files.
 *
 * @param basePath - The base path to search for files.
 * @param files - The files to search for.
 * @internal
 */ export async function findPathForFiles(basePath, files) {
    const paths = await Promise.all(files.map(async (file)=>{
        const path = join(basePath, file);
        const exists = await fileExists(path);
        return {
            exists,
            path
        };
    }));
    return paths;
}

//# sourceMappingURL=findConfigsPaths.js.map
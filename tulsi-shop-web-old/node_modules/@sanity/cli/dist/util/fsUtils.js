import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export function validateEmptyPath(dir) {
    const checkPath = absolutify(dir);
    return pathIsEmpty(checkPath) ? true : 'Given path is not empty';
}
export function absolutify(dir) {
    const pathName = expandHome(dir);
    return path.isAbsolute(pathName) ? pathName : path.resolve(process.cwd(), pathName);
}
function pathIsEmpty(dir) {
    try {
        const content = fs.readdirSync(dir);
        return content.length === 0;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return true;
        }
        throw err;
    }
}
function expandHome(filePath) {
    if (filePath.codePointAt(0) === 126 /* ~ */ ) {
        if (filePath.codePointAt(1) === 43 /* + */ ) {
            return path.join(process.cwd(), filePath.slice(2));
        }
        const home = os.homedir();
        return home ? path.join(home, filePath.slice(1)) : filePath;
    }
    return filePath;
}

//# sourceMappingURL=fsUtils.js.map
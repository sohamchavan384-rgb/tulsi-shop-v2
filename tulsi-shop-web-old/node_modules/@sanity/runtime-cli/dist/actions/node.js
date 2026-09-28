import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { getLatestNpmVersion } from '../utils/external/npmjs.js';
export async function writeOrUpdateNodeDependency(nearFilePath, dependency, logger) {
    const dir = dirname(nearFilePath);
    const extension = extname(nearFilePath);
    if (extension === '.json')
        return; // ? why do we bail out here?
    const version = await getLatestNpmVersion(dependency, logger);
    const packageJsonPath = join(dir, 'package.json');
    const packageExists = existsSync(packageJsonPath);
    if (!packageExists) {
        writeFileSync(packageJsonPath, JSON.stringify({ type: 'module', devDependencies: { [dependency]: version } }, null, 2));
        return;
    }
    const packageJson = readFileSync(packageJsonPath, 'utf8');
    let packageJsonObject;
    try {
        packageJsonObject = JSON.parse(packageJson);
    }
    catch (err) {
        throw Error(`Unable to parse package.json: ${err}`);
    }
    const allDependencies = { ...packageJsonObject.dependencies, ...packageJsonObject.devDependencies };
    if (allDependencies[dependency])
        return;
    packageJsonObject.devDependencies = packageJsonObject.devDependencies || {};
    packageJsonObject.devDependencies[dependency] = version;
    writeFileSync(packageJsonPath, JSON.stringify(packageJsonObject, null, 2));
}

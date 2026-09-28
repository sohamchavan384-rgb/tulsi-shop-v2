import { fileURLToPath } from 'node:url';
export function isInstalledUsingYarn() {
    const isWindows = process.platform === 'win32';
    const yarnPath = isWindows ? [
        'Yarn',
        'config',
        'global'
    ].join('/') : [
        '.config',
        'yarn',
        'global'
    ].join('/');
    const currentDir = fileURLToPath(import.meta.url);
    return currentDir.includes(yarnPath);
}

//# sourceMappingURL=isInstalledUsingYarn.js.map
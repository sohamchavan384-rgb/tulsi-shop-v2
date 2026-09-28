import { readFileSync } from 'node:fs';
import { dirname, join as joinPath } from 'node:path';
import { fileURLToPath } from 'node:url';
let ua = null;
export function getUserAgent() {
    if (!ua) {
        const dir = dirname(fileURLToPath(import.meta.url));
        const data = readFileSync(joinPath(dir, '..', 'package.json'), 'utf-8');
        const pkg = JSON.parse(data);
        ua = `${pkg.name}@${pkg.version}`;
    }
    return ua;
}
//# sourceMappingURL=getUserAgent.js.map
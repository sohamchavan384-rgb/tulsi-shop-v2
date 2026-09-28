import { styleText } from 'node:util';
/**
 * Formats bytes to kB
 *
 * @internal
 */ export function formatSize(bytes) {
    return styleText('cyan', `${(bytes / 1024).toFixed(0)} kB`);
}

//# sourceMappingURL=formatSize.js.map
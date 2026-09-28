import { promises as fs } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
/**
 * "Clean up" source maps by removing absolute paths and making paths relative to the
 * _input_ (eg source) rather than the _output_ (eg bundle) directory. Note that this
 * process is not critical since the source content is inlined, but it helps with
 * debugging to have (approximate) paths to the original source files.
 *
 * @param inputDir - The directory where the source files are located
 * @param outputDir - The directory where the bundled files are located
 */
export async function cleanupSourceMaps(inputDir, outputDir) {
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    const sourceMaps = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.map'));
    for (const entry of sourceMaps) {
        const filePath = join(outputDir, entry.name);
        let raw;
        try {
            raw = await fs.readFile(filePath, 'utf8');
        }
        catch {
            return;
        }
        let map;
        try {
            const json = JSON.parse(raw);
            map = isRelevantSourceMap(json) ? json : undefined;
        }
        catch {
            return;
        }
        if (!map) {
            return;
        }
        map.sources = map.sources.map((source) => {
            const fullPath = isAbsolute(source) ? source : join(outputDir, source);
            return relative(inputDir, fullPath);
        });
        try {
            await fs.writeFile(filePath, JSON.stringify(map));
        }
        catch {
            // ignore write errors
        }
    }
}
function isRelevantSourceMap(map) {
    return (typeof map === 'object' &&
        map !== null &&
        'sources' in map &&
        Array.isArray(map.sources) &&
        map.sources.every((source) => typeof source === 'string'));
}

import { existsSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
export function getExtractOptions(options) {
    const { enforceRequiredFields, format, path: pathFlag, projectRoot, watchPatterns, workspace } = options;
    let outputPath;
    if (pathFlag) {
        const resolved = resolve(join(projectRoot.directory, pathFlag));
        const isExistingDirectory = existsSync(resolved) && statSync(resolved).isDirectory();
        outputPath = isExistingDirectory || !extname(resolved) ? join(resolved, 'schema.json') : resolved;
    } else {
        outputPath = resolve(join(projectRoot.directory, 'schema.json'));
    }
    return {
        configPath: projectRoot.path,
        enforceRequiredFields: enforceRequiredFields ?? false,
        format: format ?? 'groq-type-nodes',
        outputPath,
        watchPatterns: watchPatterns ?? [],
        workspace
    };
}

//# sourceMappingURL=getExtractOptions.js.map
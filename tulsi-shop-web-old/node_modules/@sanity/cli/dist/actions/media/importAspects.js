import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { importModule } from '@sanity/cli-core';
import { validateMediaLibraryAssetAspect } from '@sanity/schema/_internal';
import { isAssetAspect } from '@sanity/types';
/**
 * File extensions that are considered valid aspect definition files
 */ const ASPECT_FILE_EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.mjs',
    '.mts',
    '.ts',
    '.tsx'
]);
/**
 * Import and validate aspect definition files from a directory
 *
 * This function reads all TypeScript/JavaScript files from the specified directory,
 * dynamically imports them using tsx for TypeScript support, validates them,
 * and returns them grouped by validation status.
 *
 * @param options - Options for importing aspects
 * @returns Promise resolving to valid and invalid aspects
 * @internal
 */ export async function importAspects(options) {
    const { aspectsPath, filterAspects = ()=>true } = options;
    // Check if directory exists
    try {
        await access(aspectsPath);
    } catch  {
        throw new Error(`Aspects directory does not exist: ${aspectsPath}`);
    }
    // Read directory entries
    const entries = await readdir(aspectsPath, {
        withFileTypes: true
    });
    // Filter for valid aspect files
    const aspectFiles = entries.filter((entry)=>entry.isFile() && ASPECT_FILE_EXTENSIONS.has(path.extname(entry.name)));
    // Import and validate all aspect files
    const aspects = [];
    for (const file of aspectFiles){
        const filename = file.name;
        const filePath = path.resolve(aspectsPath, filename);
        try {
            // Dynamically import the aspect file with TypeScript support
            const maybeAspect = await importModule(filePath);
            // Check if user wants to filter this aspect
            if (!filterAspects(maybeAspect)) {
                continue;
            }
            // Validate that it's an asset aspect
            if (!isAssetAspect(maybeAspect)) {
                aspects.push({
                    aspect: maybeAspect,
                    filename,
                    status: 'invalid',
                    validationErrors: []
                });
                continue;
            }
            // Validate the aspect schema
            const [valid, errors] = validateMediaLibraryAssetAspect(maybeAspect.definition);
            if (!valid) {
                aspects.push({
                    aspect: maybeAspect,
                    filename,
                    status: 'invalid',
                    validationErrors: errors
                });
                continue;
            }
            aspects.push({
                aspect: maybeAspect,
                filename,
                status: 'valid',
                validationErrors: []
            });
        } catch (error) {
            aspects.push({
                aspect: null,
                filename,
                status: 'invalid',
                validationErrors: [
                    [
                        {
                            message: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`,
                            severity: 'error'
                        }
                    ]
                ]
            });
        }
    }
    // Group by validation status
    const result = {
        invalid: aspects.filter((a)=>a.status === 'invalid'),
        valid: aspects.filter((a)=>a.status === 'valid')
    };
    return result;
}

//# sourceMappingURL=importAspects.js.map
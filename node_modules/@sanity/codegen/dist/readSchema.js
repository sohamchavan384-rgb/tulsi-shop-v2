import { readFile } from 'node:fs/promises';
/**
 * Read a schema from a given path
 * @param path - The path to the schema
 * @returns The schema
 * @internal
 * @beta
 **/ export async function readSchema(path) {
    const content = await readFile(path, 'utf8');
    return JSON.parse(content) // todo: ZOD validation?
    ;
}

//# sourceMappingURL=readSchema.js.map
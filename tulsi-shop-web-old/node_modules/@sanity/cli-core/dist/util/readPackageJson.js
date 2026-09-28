import { readFile } from 'node:fs/promises';
import { z } from 'zod/mini';
/**
 * Comprehensive package.json schema including all common properties.
 * Feel free to add properties to this,
 * 🟠ℹ️   BUT ENSURE OPTIONAL STUFF IS ACTUALLY OPTIONAL  ℹ️🟠
 * 🟠ℹ️ SINCE THIS IS USED IN A NUMBER OF LOCATIONS WHERE ℹ️🟠
 * 🟠ℹ️ WE CANNOT ENFORCE/GUARANTEE ANY PARTICULAR PROPS  ℹ️🟠
 */ const packageJsonSchema = z.looseObject({
    // Required fields
    name: z.string(),
    version: z.string(),
    // Dependencies (optional)
    dependencies: z.optional(z.record(z.string(), z.string())),
    devDependencies: z.optional(z.record(z.string(), z.string())),
    peerDependencies: z.optional(z.record(z.string(), z.string())),
    // Module structure (optional)
    exports: z.optional(z.record(z.string(), z.any())),
    main: z.optional(z.string()),
    types: z.optional(z.string()),
    // Metadata (optional)
    author: z.optional(z.string()),
    description: z.optional(z.string()),
    engines: z.optional(z.record(z.string(), z.string())),
    license: z.optional(z.string()),
    private: z.optional(z.boolean()),
    repository: z.optional(z.object({
        type: z.string(),
        url: z.string()
    })),
    scripts: z.optional(z.record(z.string(), z.string())),
    type: z.optional(z.enum([
        'module',
        'commonjs'
    ]))
});
/**
 * Read the `package.json` file at the given path
 *
 * @param filePath - Path to package.json to read
 * @param options - Options object for controlling read behavior
 * @returns The parsed package.json
 * @public
 */ export async function readPackageJson(filePath, options = {}) {
    const { defaults = {}, skipSchemaValidation = false } = options;
    // Read and parse the file
    let pkg;
    try {
        pkg = JSON.parse(await readFile(filePath, 'utf8'));
    } catch (err) {
        throw new Error(`Failed to read "${filePath}"`, {
            cause: err
        });
    }
    // Merge with defaults (parsed values take precedence)
    const merged = {
        ...defaults,
        ...pkg
    };
    // Validate with schema unless skipped
    let validated;
    if (skipSchemaValidation) {
        validated = merged;
    } else {
        const { data, error, success } = packageJsonSchema.safeParse(merged);
        if (!success) {
            throw new Error(`Invalid package.json at "${filePath}": ${error.issues.map((err)=>err.message).join('\n')}`);
        }
        validated = data;
    }
    return validated;
}

//# sourceMappingURL=readPackageJson.js.map
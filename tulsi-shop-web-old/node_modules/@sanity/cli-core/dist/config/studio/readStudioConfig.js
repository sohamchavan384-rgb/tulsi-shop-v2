import { dirname } from 'node:path';
import { z } from 'zod/mini';
import { studioWorkerTask } from '../../loaders/studio/studioWorkerTask.js';
const schemaSchema = z.looseObject({
    name: z.optional(z.string()),
    types: z.array(z.looseObject({}))
});
const sourceSchema = z.looseObject({
    dataset: z.string(),
    projectId: z.string(),
    schema: z.looseObject({
        _original: schemaSchema
    })
});
// Raw workspace schema (resolvePlugins: false) - unstable_sources not yet populated
const rawWorkspaceSchema = z.looseObject({
    ...sourceSchema.shape,
    basePath: z.optional(z.string()),
    name: z.optional(z.string()),
    plugins: z.optional(z.array(z.unknown())),
    schema: z.optional(schemaSchema),
    title: z.optional(z.string()),
    unstable_sources: z.optional(z.array(sourceSchema))
});
// Resolved config schema (resolvePlugins: true) - all fields required
const resolvedWorkspaceSchema = z.looseObject({
    ...sourceSchema.shape,
    basePath: z.string(),
    name: z.string(),
    plugins: z.optional(z.array(z.unknown())),
    title: z.string(),
    unstable_sources: z.array(sourceSchema)
});
const rawConfigSchema = z.union([
    z.array(rawWorkspaceSchema),
    rawWorkspaceSchema
]);
const resolvedConfigSchema = z.array(resolvedWorkspaceSchema);
export async function readStudioConfig(configPath, options) {
    const result = await studioWorkerTask(new URL('readStudioConfig.worker.js', import.meta.url), {
        name: 'studioConfig',
        studioRootPath: dirname(configPath),
        workerData: {
            configPath,
            resolvePlugins: options.resolvePlugins
        }
    });
    try {
        return options.resolvePlugins ? resolvedConfigSchema.parse(result) : rawConfigSchema.parse(result);
    } catch (err) {
        if (err instanceof z.core.$ZodError) {
            throw new TypeError(`Invalid studio config at ${configPath}:\n${formatZodIssues(err.issues)}`, {
                cause: err
            });
        }
        throw err;
    }
}
/**
 * Recursively extracts leaf-level messages from Zod issues, including
 * those nested inside union errors. Note that `prettifyError` from Zod
 * only gives a high-level summary for union errors, so this function is
 * needed to get the full details of all validation issues in a readable format.
 *
 * @internal exported for testing only
 */ export function formatZodIssues(issues, indent = 2) {
    const lines = [];
    const prefix = ' '.repeat(indent);
    for (const issue of issues){
        if (issue.code === 'invalid_union' && 'errors' in issue && Array.isArray(issue.errors)) {
            for (const [i, unionIssues] of issue.errors.entries()){
                lines.push(`${prefix}Union option ${i + 1}:`, formatZodIssues(unionIssues, indent + 2));
            }
        } else {
            const path = issue.path.length > 0 ? ` at "${issue.path.join('.')}"` : '';
            lines.push(`${prefix}- ${issue.message}${path}`);
        }
    }
    return lines.join('\n');
}

//# sourceMappingURL=readStudioConfig.js.map
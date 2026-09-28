import { z } from 'zod/mini';
export const uniqWorkspaceWorkerDataSchema = z.object({
    configPath: z.string(),
    dataset: z.optional(z.string())
});
export const extractWorkspaceWorkerData = z.object({
    configPath: z.string(),
    workDir: z.string()
});

//# sourceMappingURL=types.js.map
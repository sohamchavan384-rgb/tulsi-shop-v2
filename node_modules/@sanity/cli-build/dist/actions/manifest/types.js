import { z } from 'zod/mini';
export const SANITY_WORKSPACE_SCHEMA_ID_PREFIX = '_.schemas';
export const CURRENT_WORKSPACE_SCHEMA_VERSION = '2025-05-01';
// The studio/app manifest contract lives in `@sanity/cli-core` so the CLI and
// the workbench dev-server registry validate against the same schemas without
// depending on each other.
export { coreAppManifestSchema } from '@sanity/cli-core';
export const extractManifestWorkerData = z.object({
    configPath: z.string(),
    workDir: z.string()
});

//# sourceMappingURL=types.js.map
import { SchemaExtractionError } from '@sanity/cli-build/_internal/extract';
import { studioWorkerTask } from '@sanity/cli-core';
import { updateWorkspacesSchemas } from './updateWorkspaceSchema.js';
export async function deploySchemas(options) {
    const { tag, verbose, workDir, workspaceName } = options;
    const result = await studioWorkerTask(new URL('extractSanityWorkspace.worker.js', import.meta.url), {
        name: 'extractSanityWorkspace',
        studioRootPath: workDir,
        workerData: {
            configPath: workDir,
            workDir
        }
    });
    if (result.type === 'error') {
        throw new SchemaExtractionError(result.error, result.validation);
    }
    const workspaces = result.workspaces.filter((workspace)=>!workspaceName || workspace.name === workspaceName).map((workspace)=>({
            dataset: workspace.dataset,
            manifestSchema: workspace.manifestSchema,
            name: workspace.name,
            projectId: workspace.projectId,
            title: workspace.title
        }));
    if (workspaces.length === 0) {
        const error = workspaceName ? new Error(`Found no workspaces named "${workspaceName}"`) : new Error('No workspaces found');
        throw error;
    }
    await updateWorkspacesSchemas({
        tag,
        verbose,
        workspaces
    });
}

//# sourceMappingURL=deploySchemas.js.map
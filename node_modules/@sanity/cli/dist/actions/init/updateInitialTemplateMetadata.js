import { subdebug } from '@sanity/cli-core';
import { updateProjectInitalTemplate } from '../../services/projects.js';
const debug = subdebug('init:updateInitialTemplateMetadata');
export async function updateInitialTemplateMetadata(projectId, templateName) {
    try {
        await updateProjectInitalTemplate(projectId, templateName);
    } catch (err) {
        // Non-critical that we update this metadata, and user does not need to be aware
        let message = typeof err === 'string' ? err : '<unknown error>';
        if (err instanceof Error) {
            message = err.message;
        }
        debug('Failed to update initial template metadata for project: %s', message);
    }
}

//# sourceMappingURL=updateInitialTemplateMetadata.js.map
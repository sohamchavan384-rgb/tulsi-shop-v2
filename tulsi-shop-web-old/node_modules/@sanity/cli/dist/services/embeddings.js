import { getProjectCliClient } from '@sanity/cli-core';
import { DATASET_API_VERSION } from './datasets.js';
function getEmbeddingsClient(projectId) {
    return getProjectCliClient({
        apiVersion: DATASET_API_VERSION,
        projectId,
        requireUser: true
    });
}
export async function getEmbeddingsSettings(projectId, dataset) {
    const client = await getEmbeddingsClient(projectId);
    return client.datasets.getEmbeddingsSettings(dataset);
}
export async function setEmbeddingsSettings({ dataset, enabled, projectId, projection }) {
    const client = await getEmbeddingsClient(projectId);
    const body = {
        enabled,
        ...projection ? {
            projection
        } : {}
    };
    await client.datasets.editEmbeddingsSettings(dataset, body);
}

//# sourceMappingURL=embeddings.js.map
import { createClient } from '@sanity/client';
import { createTracedFetch } from '../traced-fetch.js';
export async function fetchDocument(documentId, { projectId, dataset, useCdn = true, apiVersion = '2025-02-06', apiHost, token }, logger) {
    const spinner = logger.ora(`Fetching document ID ${documentId}...`).start();
    const client = createClient({ projectId, dataset, useCdn, apiVersion, apiHost, token });
    const data = await client.fetch(`*[_id == "${documentId}"]`);
    spinner.stop();
    if (!data[0]) {
        throw Error(`Could not fetch document ID ${documentId}`);
    }
    return data[0];
}
export async function fetchAsset(documentId, { mediaLibraryId, apiVersion = '2025-03-24', apiHost, token }, logger) {
    const spinner = logger.ora(`Fetching document ID ${documentId}...`).start();
    const fetchFn = createTracedFetch(logger);
    const url = `${apiHost}/v${apiVersion}/media-libraries/${mediaLibraryId}/doc/${documentId}`;
    const response = await fetchFn(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json();
    spinner.stop();
    if (!data?.documents[0]) {
        throw Error(`Could not fetch document ID ${documentId}`);
    }
    return data.documents[0];
}

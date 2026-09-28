import { getSanityUrl } from '@sanity/cli-core';
const DOCS_API_TIMEOUT = 10_000;
function isSearchResult(obj) {
    return typeof obj === 'object' && obj !== null && 'description' in obj && 'path' in obj && 'title' in obj && typeof obj.description === 'string' && typeof obj.path === 'string' && typeof obj.title === 'string';
}
export async function readDoc(options) {
    const url = getSanityUrl(`${options.path}.md`);
    const response = await fetch(url, {
        headers: {
            Accept: 'text/plain'
        },
        method: 'GET',
        signal: AbortSignal.timeout(DOCS_API_TIMEOUT)
    });
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Article not found: ${options.path}`);
        }
        throw new Error('The article API is currently unavailable. Please try again later.');
    }
    return response.text();
}
export async function searchDocs(options) {
    const { limit = 10, query } = options;
    const baseUrl = getSanityUrl('/docs/api/search/semantic');
    const url = new URL(baseUrl);
    url.searchParams.set('query', query);
    const response = await fetch(url.toString(), {
        headers: {
            Accept: 'application/json'
        },
        method: 'GET',
        signal: AbortSignal.timeout(DOCS_API_TIMEOUT)
    });
    if (!response.ok) {
        throw new Error('The documentation search API is currently unavailable. Please try again later.');
    }
    const results = await response.json();
    if (!Array.isArray(results)) {
        throw new TypeError('Invalid response format from documentation search API');
    }
    const validResults = results.filter((item)=>isSearchResult(item));
    return validResults.slice(0, limit);
}

//# sourceMappingURL=docs.js.map
import { env } from 'node:process';
import { createTracedFetch } from '../traced-fetch.js';
export async function getLatestNpmVersion(pkg, logger) {
    const fetchFn = createTracedFetch(logger);
    // allow for registry override; helpful for testing
    const registry = env.SANITY_INTERNAL_NPM_REGISTRY_URL || 'https://registry.npmjs.org';
    const url = `${registry}/${pkg}/latest`;
    try {
        const res = await fetchFn(url);
        if (!res.ok)
            throw new Error(`Failed to fetch version for ${pkg}`);
        const data = await res.json();
        return data.version;
    }
    catch {
        return 'latest';
    }
}

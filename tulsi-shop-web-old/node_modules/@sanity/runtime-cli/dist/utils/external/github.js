// ! Making requests to the GitHub API will be rate limited at 60 requests per hour per IP address
// https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-unauthenticated-users
import { createTracedFetch } from '../traced-fetch.js';
export const GITHUB_API_URL = 'https://api.github.com';
export async function gitHubRequest(path, logger) {
    const fetchFn = createTracedFetch(logger);
    const response = await fetchFn(`${GITHUB_API_URL}${path}`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (response.ok) {
        const remaining = Number(response.headers.get('X-RateLimit-Remaining'));
        const limit = Number(response.headers.get('X-RateLimit-Limit'));
        const reset = Number(response.headers.get('X-RateLimit-Reset'));
        if (remaining && limit && reset) {
            const percentRemaining = (remaining / limit) * 100;
            const percentUsed = 100 - percentRemaining;
            if (percentUsed > 85) {
                // warn if near rate limit
                console.warn(`Warning: You have used ${percentUsed.toFixed(2)}% of your GitHub API requests.`);
                const resetTime = new Date(reset * 1000);
                console.log(`Reset in ${Math.floor((resetTime.getTime() - Date.now()) / 60000)} minutes`);
            }
        }
    }
    else {
        // check for rate limit error
        if (response.status === 403 || response.status === 429) {
            console.error('GitHub API rate limit exceeded');
        }
    }
    return response; // always return the response
}

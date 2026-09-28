import config from '../config.js';
import { createTracedFetch } from './traced-fetch.js';
export async function validToken(logger, maybeToken) {
    if (config.isTest)
        return maybeToken ?? 'token';
    const token = maybeToken ?? config.token;
    if (!token)
        throw new Error('NO_TOKEN');
    if (!config.isLive)
        return token;
    const fetchFn = createTracedFetch(logger);
    const url = `${config.populusApiUrl}v2025-04-23/users/me`;
    const response = await fetchFn(url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    if (response.ok) {
        const data = await response.json();
        if (data.id)
            return token;
        throw new Error('NO_USER');
    }
    throw new Error('SERVER_ERROR', { cause: response.statusText });
}
export async function validTokenOrErrorMessage(logger, maybeToken) {
    try {
        const token = await validToken(logger, maybeToken);
        return { ok: true, value: token };
    }
    catch (e) {
        if (e instanceof Error) {
            switch (e.message) {
                case 'NO_TOKEN':
                    return {
                        ok: false,
                        error: {
                            e,
                            message: 'No API token found. Use `npx @sanity/cli login` to login.',
                        },
                    };
                case 'NO_USER':
                    return {
                        ok: false,
                        error: {
                            e,
                            message: 'User is not authenticated. Use `npx @sanity/cli login` to login.',
                        },
                    };
                case 'SERVER_ERROR':
                    return {
                        ok: false,
                        error: {
                            e,
                            message: `Server error: "${e.cause}". Try logging in again with \`npx @sanity/cli login\``,
                        },
                    };
                default:
                    return { ok: false, error: { e, message: e.message } };
            }
        }
        return { ok: false, error: { e, message: 'Unknown error' } };
    }
}

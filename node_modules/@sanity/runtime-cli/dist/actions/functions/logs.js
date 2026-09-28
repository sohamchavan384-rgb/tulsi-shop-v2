import { EventSource } from 'eventsource';
import config from '../../config.js';
import getHeaders from '../../utils/get-headers.js';
import { createTracedFetch } from '../../utils/traced-fetch.js';
const { apiUrl } = config;
export async function logs(id, options, auth, logger) {
    const { limit } = options;
    const fetchFn = createTracedFetch(logger);
    const response = await fetchFn(`${apiUrl}v2025-07-30/functions/${id}/logs?limit=${limit}`, {
        headers: getHeaders(auth),
        method: 'GET',
    });
    const json = await response.json();
    return {
        ok: response.ok,
        error: response.ok ? null : json?.error?.message,
        logs: response.ok ? json.logs : [],
    };
}
export async function deleteLogs(id, auth, logger) {
    const fetchFn = createTracedFetch(logger);
    const response = await fetchFn(`${apiUrl}v2025-07-30/functions/${id}/logs`, {
        headers: getHeaders(auth),
        method: 'DELETE',
    });
    const json = response.ok ? null : await response.json();
    return {
        ok: response.ok,
        error: response.ok ? null : json?.error?.message,
    };
}
// Create streaming logs connection
export function streamLogs(id, auth, onLog, onOpen, onError, logger) {
    const url = new URL(`${apiUrl}v2025-07-30/functions/${id}/logs/stream`);
    const headers = getHeaders(auth);
    const fetchFn = createTracedFetch(logger);
    const eventSource = new EventSource(url.toString(), {
        fetch: (input, init) => fetchFn(input, {
            ...init,
            headers: {
                ...init?.headers,
                ...headers,
            },
        }),
    });
    eventSource.onopen = onOpen;
    eventSource.onmessage = (event) => {
        try {
            const log = JSON.parse(event.data);
            onLog(log);
        }
        catch (err) {
            onError(`Failed to parse log data: ${err instanceof Error ? err.message : String(err)}`);
        }
    };
    eventSource.addEventListener('logs', (event) => {
        try {
            const logData = JSON.parse(event.data);
            // usually an array
            if (Array.isArray(logData)) {
                for (const log of logData)
                    onLog(log);
            }
            else {
                onLog(logData);
            }
        }
        catch (err) {
            console.error('Error parsing logs event:', err);
        }
    });
    eventSource.onerror = () => {
        onError('Connection to log stream failed or was closed');
        if (eventSource.readyState === eventSource.CLOSED) {
            console.log('Connection is CLOSED');
        }
        else if (eventSource.readyState === eventSource.CONNECTING) {
            console.log('Connection is attempting to reconnect...');
            return; // Don't close if trying to reconnect
        }
        eventSource.close();
    };
    return () => {
        eventSource.close();
    };
}

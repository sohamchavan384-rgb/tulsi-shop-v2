function isRecord(thing) {
    return typeof thing === 'object' && thing !== null && !Array.isArray(thing);
}
function isErrorWithResponse(err) {
    if (!isRecord(err)) {
        return false;
    }
    if (!('response' in err) || !isRecord(err.response)) {
        return false;
    }
    const response = err.response;
    return ('body' in response &&
        isRecord(response.body) &&
        'pipe' in response.body &&
        'headers' in response &&
        isRecord(response.headers));
}
async function readBody(req) {
    const chunks = [];
    for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
async function readBodyJson(req) {
    return JSON.parse((await readBody(req)).toString('utf8'));
}
export async function tryThrowFriendlyError(err) {
    if (!isErrorWithResponse(err)) {
        return null;
    }
    const contentType = err.response.headers['content-type'];
    if (typeof contentType !== 'string' || !contentType.includes('application/json')) {
        return null;
    }
    const body = await readBodyJson(err.response.body);
    if (!isRecord(body)) {
        return null;
    }
    const typedBody = body;
    const status = typeof err.response.statusCode === 'number' ? `HTTP ${err.response.statusCode}` : undefined;
    const error = typeof typedBody.error === 'string' ? typedBody.error : undefined;
    const message = typeof typedBody.message === 'string' ? typedBody.message : undefined;
    if (!error && !message) {
        return null;
    }
    throw new Error(['Export', status, error, message].filter(Boolean).join(': '));
}
//# sourceMappingURL=friendlyError.js.map
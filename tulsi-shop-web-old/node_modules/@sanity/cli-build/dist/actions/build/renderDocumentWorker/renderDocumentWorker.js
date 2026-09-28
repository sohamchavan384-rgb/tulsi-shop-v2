import { getDocumentHtml } from './getDocumentHtml.js';
/**
 * Renders a document in a worker thread
 *
 * @param parent - The parent port to send messages to
 * @param options - The options for the document to render
 * @returns - The rendered document
 */ export async function renderDocumentWorker(parent, options) {
    const { autoUpdatesCssUrls, importMap, isApp, props, studioRootPath } = options;
    if (typeof studioRootPath !== 'string') {
        parent.postMessage({
            message: 'Missing/invalid `studioRootPath` option',
            type: 'error'
        });
        return;
    }
    if (props && typeof props !== 'object') {
        parent.postMessage({
            message: '`props` must be an object if provided',
            type: 'error'
        });
        return;
    }
    const html = await getDocumentHtml(parent, studioRootPath, props, importMap, isApp, autoUpdatesCssUrls);
    parent.postMessage({
        html,
        type: 'result'
    });
}

//# sourceMappingURL=renderDocumentWorker.js.map
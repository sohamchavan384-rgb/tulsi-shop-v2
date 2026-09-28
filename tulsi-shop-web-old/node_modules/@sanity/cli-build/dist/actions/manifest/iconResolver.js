import { resolveLocalPackage } from '@sanity/cli-core';
import { manifestDebug } from './debug.js';
import { resolveSchemaIcon } from './resolveSchemaIcon.js';
import { sanitizeIcon } from './sanitizeIcon.js';
/**
 * Resolves an icon to a sanitized HTML string.
 * Uses react-dom/server to capture styles during SSR.
 *
 * react-dom/server is resolved from the studio's working directory to ensure
 * the same React instance is used by both the server renderer and the studio's
 * components. Using the CLI's own react-dom/server would cause a dual-React
 * instance problem where the dispatcher set by one instance is invisible to the other.
 */ export const resolveIcon = async (props)=>{
    try {
        const [{ renderToReadableStream }, element] = await Promise.all([
            resolveLocalPackage('react-dom/server', props.workDir),
            resolveSchemaIcon(props)
        ]);
        const stream = await renderToReadableStream(element);
        await stream.allReady;
        const reader = stream.getReader();
        const chunks = [];
        while(true){
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const html = new TextDecoder().decode(Buffer.concat(chunks));
        return sanitizeIcon(html);
    } catch (error) {
        manifestDebug('Error resolving icon', error);
        return null;
    }
};

//# sourceMappingURL=iconResolver.js.map
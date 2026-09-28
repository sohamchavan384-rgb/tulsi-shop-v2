import { findStudioConfigPath } from '../util/findStudioConfigPath.js';
import { readStudioConfig } from './readStudioConfig.js';
export async function getStudioConfig(rootPath, options) {
    const studioConfigPath = await findStudioConfigPath(rootPath);
    // TypeScript is not being very clever with our overloads :(
    return options.resolvePlugins ? readStudioConfig(studioConfigPath, {
        resolvePlugins: true
    }) : readStudioConfig(studioConfigPath, {
        resolvePlugins: false
    });
}

//# sourceMappingURL=getStudioConfig.js.map
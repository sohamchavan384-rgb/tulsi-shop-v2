import path from 'node:path';
import { input } from '@sanity/cli-core/ux';
import { absolutify, validateEmptyPath } from '../../../util/fsUtils.js';
export async function getProjectOutputPath({ initFramework, outputPath, sluggedName, unattended, useEnv, workDir }) {
    const specifiedPath = outputPath && path.resolve(outputPath);
    if (unattended || specifiedPath || useEnv || initFramework) {
        return specifiedPath || workDir;
    }
    const inputPath = await input({
        default: path.join(workDir, sluggedName),
        message: 'Project output path:',
        validate: validateEmptyPath
    });
    return absolutify(inputPath);
}

//# sourceMappingURL=getProjectOutputPath.js.map
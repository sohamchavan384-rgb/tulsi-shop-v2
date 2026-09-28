import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const SCHEMA_FILENAME_SUFFIX = '.create-schema.json';
const TOOLS_FILENAME_SUFFIX = '.create-tools.json';
export function writeWorkspaceFiles(manifestWorkspaces, staticPath) {
    const output = manifestWorkspaces.map((workspace)=>writeWorkspaceFile(workspace, staticPath));
    return Promise.all(output);
}
async function writeWorkspaceFile(workspace, staticPath) {
    const [schemaFilename, toolsFilename] = await Promise.all([
        createFile(staticPath, workspace.schema, SCHEMA_FILENAME_SUFFIX),
        createFile(staticPath, workspace.tools, TOOLS_FILENAME_SUFFIX)
    ]);
    return {
        ...workspace,
        schema: schemaFilename,
        tools: toolsFilename
    };
}
async function createFile(path, content, filenameSuffix) {
    const stringifiedContent = JSON.stringify(content, null, 2);
    const hash = createHash('sha1').update(stringifiedContent).digest('hex');
    const filename = `${hash.slice(0, 8)}${filenameSuffix}`;
    // workspaces with identical data will overwrite each others file. This is ok, since they are identical and can be shared
    await writeFile(join(path, filename), stringifiedContent);
    return filename;
}

//# sourceMappingURL=writeWorkspaceFiles.js.map
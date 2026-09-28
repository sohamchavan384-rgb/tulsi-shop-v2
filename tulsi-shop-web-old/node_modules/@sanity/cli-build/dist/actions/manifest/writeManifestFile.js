import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { getLocalPackageVersion, subdebug } from '@sanity/cli-core';
import { writeWorkspaceFiles } from './writeWorkspaceFiles.js';
export const MANIFEST_FILENAME = 'create-manifest.json';
const debug = subdebug('writeManifestFile');
export async function writeManifestFile({ outPath, workDir, workspaceManifests }) {
    const staticPath = isAbsolute(outPath) ? outPath : resolve(join(workDir, outPath));
    debug('Writing manifest to %s', staticPath);
    const path = join(staticPath, MANIFEST_FILENAME);
    await mkdir(staticPath, {
        recursive: true
    });
    const workspaceFiles = await writeWorkspaceFiles(workspaceManifests, staticPath);
    const manifest = {
        /**
     * Version history:
     * 1: Initial release.
     * 2: Added tools file.
     * 3. Added studioVersion field.
     */ createdAt: new Date().toISOString(),
        studioVersion: await getLocalPackageVersion('sanity', workDir),
        version: 3,
        workspaces: workspaceFiles
    };
    await writeFile(path, JSON.stringify(manifest, null, 2));
}

//# sourceMappingURL=writeManifestFile.js.map
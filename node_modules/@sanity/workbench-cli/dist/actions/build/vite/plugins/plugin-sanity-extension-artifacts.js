import fs from 'node:fs';
import path from 'node:path';
import { RUNTIME_DIR } from '../constants.js';
function relativeImport(fromFile, toFile) {
    const rel = path.relative(path.dirname(fromFile), toFile).split(path.sep).join('/');
    return rel.startsWith('.') ? rel : `./${rel}`;
}
function writeArtifacts(root, artifacts) {
    for (const artifact of artifacts){
        const artifactPath = path.resolve(root, RUNTIME_DIR, artifact.path);
        fs.mkdirSync(path.dirname(artifactPath), {
            recursive: true
        });
        fs.writeFileSync(artifactPath, artifact.source({
            resolveImport: (src)=>relativeImport(artifactPath, path.resolve(root, src))
        }));
    }
}
/**
 * Writes the federation runtime artifacts (view render-contract modules, service
 * worker bundles + loaders) into `RUNTIME_DIR`, resolving each artifact's import
 * paths relative to where it lands on disk. The set is expanded once by
 * `workbenchArtifacts` and handed in — this plugin only writes it.
 */ export function sanityExtensionArtifacts(options) {
    return {
        configResolved (config) {
            writeArtifacts(config.root, options.artifacts);
        },
        name: 'sanity/extension-artifacts'
    };
}

//# sourceMappingURL=plugin-sanity-extension-artifacts.js.map
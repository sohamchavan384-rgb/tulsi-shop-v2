import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
async function fileExists(filePath) {
    try {
        await stat(filePath);
        return true;
    } catch  {
        return false;
    }
}
async function isFile(filePath) {
    try {
        const s = await stat(filePath);
        return s.isFile();
    } catch  {
        return false;
    }
}
async function checkDetector(rootPath, framework, detector) {
    let { matchContent, path: filePath } = detector;
    const { matchPackage } = detector;
    if (matchPackage && matchContent) {
        throw new Error(`Cannot specify "matchPackage" and "matchContent" in the same detector for "${framework.slug}"`);
    }
    if (matchPackage && filePath) {
        throw new Error(`Cannot specify "matchPackage" and "path" in the same detector for "${framework.slug}"`);
    }
    if (!filePath && !matchPackage) {
        throw new Error(`Must specify either "path" or "matchPackage" in detector for "${framework.slug}".`);
    }
    if (!filePath) {
        filePath = 'package.json';
    }
    if (matchPackage) {
        const escapedPkg = matchPackage.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
        matchContent = String.raw`"(dev)?(d|D)ependencies":\s*{[^}]*"${escapedPkg}":\s*"(.+?)"[^}]*}`;
    }
    const fullPath = join(rootPath, filePath);
    if (!await fileExists(fullPath)) {
        return undefined;
    }
    if (matchContent) {
        if (!await isFile(fullPath)) {
            return undefined;
        }
        const content = await readFile(fullPath, 'utf8');
        const match = content.match(new RegExp(matchContent, 'm'));
        if (!match) {
            return undefined;
        }
        if (matchPackage && match[3]) {
            return {
                detectedVersion: match[3],
                framework
            };
        }
    }
    return {
        framework
    };
}
async function matchFramework(rootPath, framework) {
    const { detectors } = framework;
    if (!detectors) return undefined;
    const { every, some } = detectors;
    if (every !== undefined && !Array.isArray(every)) return undefined;
    if (some !== undefined && !Array.isArray(some)) return undefined;
    const results = [];
    if (every) {
        const everyResults = await Promise.all(every.map((item)=>checkDetector(rootPath, framework, item)));
        results.push(...everyResults);
    }
    if (some) {
        let someResult;
        for (const item of some){
            const result = await checkDetector(rootPath, framework, item);
            if (result) {
                someResult = result;
                break;
            }
        }
        results.push(someResult);
    }
    if (results.length === 0) return undefined;
    if (!results.every((r)=>r !== undefined)) {
        return undefined;
    }
    const detectedVersion = results.find((r)=>r !== undefined && r.detectedVersion !== undefined)?.detectedVersion;
    return {
        detectedVersion,
        framework
    };
}
function removeSupersededFrameworks(matches) {
    // Snapshot to avoid mutation-during-iteration when splice shifts elements
    const snapshot = [
        ...matches
    ];
    for (const match of snapshot){
        if (match?.supersedes) {
            for (const slug of match.supersedes){
                removeSupersededFramework(matches, slug);
            }
        }
    }
}
function removeSupersededFramework(matches, slug) {
    const index = matches.findIndex((f)=>f?.slug === slug);
    const framework = matches[index];
    if (framework) {
        matches.splice(index, 1);
        if (framework.supersedes) {
            for (const s of framework.supersedes){
                removeSupersededFramework(matches, s);
            }
        }
    }
}
export async function detectFrameworkRecord(options) {
    const { frameworkList, rootPath } = options;
    const results = await Promise.all(frameworkList.map(async (fw)=>{
        const match = await matchFramework(rootPath, fw);
        if (match) {
            return {
                ...fw,
                detectedVersion: match.detectedVersion
            };
        }
        return null;
    }));
    removeSupersededFrameworks(results);
    return results.find((r)=>r !== null) ?? null;
}

//# sourceMappingURL=detectFramework.js.map
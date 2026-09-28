import { formatSize } from './formatSize.js';
export function formatModuleSizes(modules) {
    const lines = [];
    for (const mod of modules){
        lines.push(` - ${formatModuleName(mod.name)} (${formatSize(mod.renderedLength)})`);
    }
    return lines.join('\n');
}
function formatModuleName(modName) {
    const delimiter = '/node_modules/';
    const nodeIndex = modName.lastIndexOf(delimiter);
    return nodeIndex === -1 ? modName : modName.slice(nodeIndex + delimiter.length);
}
export function sortModulesBySize(chunks) {
    return chunks.flatMap((chunk)=>chunk.modules).toSorted((modA, modB)=>modB.renderedLength - modA.renderedLength);
}

//# sourceMappingURL=moduleFormatUtils.js.map
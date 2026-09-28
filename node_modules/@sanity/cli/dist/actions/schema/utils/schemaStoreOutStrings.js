export function getDatasetsOutString(datasets) {
    return datasets.length === 1 ? `dataset "${datasets[0]}"` : `datasets ${getStringArrayOutString(datasets)}`;
}
function getStringArrayOutString(array) {
    return `[${array.map((d)=>`"${d}"`).join(',')}]`;
}
export function getStringList(array) {
    return array.map((s)=>`- "${s}"`).join('\n');
}

//# sourceMappingURL=schemaStoreOutStrings.js.map
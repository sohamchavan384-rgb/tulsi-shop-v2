import uniqBy from 'lodash-es/uniqBy.js';
export function uniqByProjectIdDataset(workspaces) {
    return uniqBy(workspaces.map((w)=>({
            ...w,
            key: `${w.projectId}-${w.dataset}`
        })), 'key');
}

//# sourceMappingURL=uniqByProjectIdDataset.js.map
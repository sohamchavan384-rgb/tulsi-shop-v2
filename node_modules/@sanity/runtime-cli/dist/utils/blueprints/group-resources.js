const BLUEPRINT_TYPE_TO_KEY = {
    'sanity.project.webhook': 'webhook',
    'sanity.project.cors': 'cors',
    'sanity.project.origin': 'cors',
    'sanity.access.role': 'role',
    'sanity.project.dataset': 'dataset',
    'sanity.project': 'project',
};
export function groupBlueprintResources(blueprintResources) {
    const grouped = {};
    for (const resource of blueprintResources) {
        if (resource.type === 'sanity.access.robot')
            continue;
        const key = (resource.type?.startsWith('sanity.function.')
            ? 'function'
            : BLUEPRINT_TYPE_TO_KEY[resource.type]) ?? resource.type?.split('.').pop();
        if (!key)
            continue;
        if (!grouped[key])
            grouped[key] = [];
        const externalId = resource.externalId;
        grouped[key].push({
            id: externalId || 'not-deployed',
            name: resource.name,
            type: resource.type,
        });
    }
    return grouped;
}

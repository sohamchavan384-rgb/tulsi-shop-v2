import { Separator } from '@sanity/cli-core/ux';
function isOrganizationWithGrant(org) {
    return 'hasAttachGrant' in org;
}
export function getOrganizationChoices(organizations) {
    const choices = organizations.map((org)=>{
        if (isOrganizationWithGrant(org)) {
            return {
                disabled: org.hasAttachGrant ? false : 'Insufficient permissions',
                name: `${org.organization.name} [${org.organization.id}]`,
                value: org.organization.id
            };
        }
        return {
            name: `${org.name} [${org.id}]`,
            value: org.id
        };
    });
    return [
        {
            name: 'Create new organization',
            value: '-new-'
        },
        ...choices.length > 0 ? [
            new Separator(),
            ...choices
        ] : []
    ];
}

//# sourceMappingURL=getOrganizationChoices.js.map
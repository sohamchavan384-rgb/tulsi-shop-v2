import { hasProjectAttachGrant } from './hasProjectAttachGrant.js';
export async function getOrganizationsWithAttachGrantInfo(organizations) {
    return Promise.all(organizations.map(async (organization)=>({
            hasAttachGrant: await hasProjectAttachGrant(organization.id),
            organization
        })));
}

//# sourceMappingURL=getOrganizationsWithAttachGrantInfo.js.map
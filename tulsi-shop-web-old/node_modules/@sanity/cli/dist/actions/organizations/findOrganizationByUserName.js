export function findOrganizationByUserName(organizations, user) {
    return organizations.find((org)=>org.name === user?.name)?.id;
}

//# sourceMappingURL=findOrganizationByUserName.js.map
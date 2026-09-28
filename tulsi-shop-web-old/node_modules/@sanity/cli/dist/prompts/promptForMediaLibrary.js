import { select, Separator } from '@sanity/cli-core/ux';
/**
 * Prompts the user to select a media library from a list of media libraries
 * grouped by organization ID
 *
 * @param mediaLibraries - The list of media libraries to choose from
 * @returns The selected media library ID
 *
 * @internal
 */ export async function promptForMediaLibrary(options) {
    const { mediaLibraries } = options;
    // Group media libraries by organization ID
    const groupedByOrg = {};
    for (const library of mediaLibraries){
        if (!groupedByOrg[library.organizationId]) {
            groupedByOrg[library.organizationId] = [];
        }
        groupedByOrg[library.organizationId].push(library);
    }
    // Create choices with organization separators
    const choices = [];
    for (const [organizationId, libraries] of Object.entries(groupedByOrg)){
        choices.push(new Separator(`Organization: ${organizationId}`));
        for (const library of libraries){
            choices.push({
                name: library.id,
                value: library.id
            });
        }
    }
    return select({
        choices,
        message: 'Select media library:'
    });
}

//# sourceMappingURL=promptForMediaLibrary.js.map
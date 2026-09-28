import { spinner } from '@sanity/cli-core/ux';
import { promptForOrganizationName } from '../../../prompts/promptForOrganizationName.js';
import { createOrganization } from '../../../services/organizations.js';
export async function promptUserForNewOrganization(user) {
    const name = await promptForOrganizationName(user);
    const spin = spinner('Creating organization').start();
    const organization = await createOrganization(name);
    spin.succeed();
    return organization;
}

//# sourceMappingURL=promptUserForNewOrganization.js.map
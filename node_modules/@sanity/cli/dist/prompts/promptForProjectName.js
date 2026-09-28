import { input } from '@sanity/cli-core/ux';
import { validateProjectName } from '../actions/projects/validateProjectName.js';
export async function promptForProjectName() {
    return input({
        default: 'My Sanity Project',
        message: 'Project name:',
        validate: validateProjectName
    });
}

//# sourceMappingURL=promptForProjectName.js.map
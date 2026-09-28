import { workbenchStudioConfigTemplate } from '@sanity/workbench-cli/init';
import { processTemplate } from './processTemplate.js';
const defaultTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '%projectId%',
    dataset: '%dataset%'
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: __BOOL__autoUpdates__,
  },
})
`;
export function createCliConfig(options) {
    const { isWorkbenchApp, ...variables } = options;
    return processTemplate({
        includeBooleanTransform: true,
        template: isWorkbenchApp ? workbenchStudioConfigTemplate : defaultTemplate,
        variables
    });
}

//# sourceMappingURL=createCliConfig.js.map
import { workbenchAppConfigTemplate } from '@sanity/workbench-cli/init';
import { processTemplate } from './processTemplate.js';
const defaultAppTemplate = `
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  app: {
    organizationId: '%organizationId%',
    entry: '%entry%',
  },
})
`;
export function createAppCliConfig(options) {
    const { isWorkbenchApp, ...variables } = options;
    return processTemplate({
        includeBooleanTransform: true,
        template: isWorkbenchApp ? workbenchAppConfigTemplate : defaultAppTemplate,
        variables
    });
}

//# sourceMappingURL=createAppCliConfig.js.map
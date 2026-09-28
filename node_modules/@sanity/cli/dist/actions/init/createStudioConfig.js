import { processTemplate } from './processTemplate.js';
const defaultTemplate = `
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: '%sourceName%',
  title: '%projectName%',

  projectId: '%projectId%',
  dataset: '%dataset%',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
`;
const defaultVariables = {
    projectName: 'Sanity Studio',
    sourceName: 'default',
    sourceTitle: 'Default'
};
export function createStudioConfig(options) {
    const variables = {
        ...defaultVariables,
        ...options.variables
    };
    if (typeof options.template === 'function') {
        return options.template(variables).trimStart();
    }
    return processTemplate({
        template: options.template || defaultTemplate,
        variables
    });
}

//# sourceMappingURL=createStudioConfig.js.map
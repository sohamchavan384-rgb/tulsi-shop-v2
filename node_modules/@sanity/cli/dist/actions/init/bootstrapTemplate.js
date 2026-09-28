import { bootstrapLocalTemplate } from './bootstrapLocalTemplate.js';
import { bootstrapRemoteTemplate } from './bootstrapRemoteTemplate.js';
export async function bootstrapTemplate({ autoUpdates, bearerToken, dataset, organizationId, output, outputPath, overwriteFiles, packageName, projectId, projectName, remoteTemplateInfo, templateName, useTypeScript, workbench }) {
    const bootstrapVariables = {
        autoUpdates,
        dataset,
        organizationId,
        projectId,
        projectName,
        workbench
    };
    if (remoteTemplateInfo) {
        return bootstrapRemoteTemplate({
            bearerToken,
            output,
            outputPath,
            packageName,
            repoInfo: remoteTemplateInfo,
            variables: bootstrapVariables
        });
    }
    return bootstrapLocalTemplate({
        output,
        outputPath,
        overwriteFiles,
        packageName,
        templateName,
        useTypeScript,
        variables: bootstrapVariables
    });
}

//# sourceMappingURL=bootstrapTemplate.js.map
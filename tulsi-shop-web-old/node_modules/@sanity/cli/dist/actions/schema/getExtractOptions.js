import { getExtractOptions as internalExtractOptions } from '@sanity/cli-build/_internal/extract';
export function getExtractOptions({ flags, projectRoot, schemaExtraction }) {
    return internalExtractOptions({
        enforceRequiredFields: flags['enforce-required-fields'] ?? schemaExtraction?.enforceRequiredFields,
        format: flags.format,
        path: flags.path ?? schemaExtraction?.path,
        projectRoot: projectRoot,
        watchPatterns: flags['watch-patterns'] ?? schemaExtraction?.watchPatterns,
        workspace: flags.workspace ?? schemaExtraction?.workspace
    });
}

//# sourceMappingURL=getExtractOptions.js.map
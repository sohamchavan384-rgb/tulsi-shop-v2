import { doImport, resolveLocalPackage } from '@sanity/cli-core';
import { transformType } from './schemaTypeTransformer.js';
const iconResolverPath = new URL('iconResolver.js', import.meta.url).href;
async function lazyResolveIcon() {
    const mod = await doImport(iconResolverPath);
    return mod.resolveIcon;
}
/**
 * Extracts manifest data from an array of workspaces
 */ export async function extractWorkspaceManifest(workspaces, workDir) {
    const resolveIcon = await lazyResolveIcon();
    return Promise.all(workspaces.map(async (workspace)=>{
        const [icon, serializedSchema, serializedTools] = await Promise.all([
            resolveIcon({
                icon: workspace.icon,
                subtitle: workspace.subtitle,
                title: workspace.title,
                workDir
            }),
            extractManifestSchemaTypes(workspace.schema, workDir),
            extractManifestTools(workspace.tools, workDir, resolveIcon)
        ]);
        return {
            basePath: workspace.basePath,
            dataset: workspace.dataset,
            icon,
            mediaLibrary: workspace.mediaLibrary,
            name: workspace.name,
            projectId: workspace.projectId,
            schema: serializedSchema,
            subtitle: workspace.subtitle,
            title: workspace.title,
            tools: serializedTools
        };
    }));
}
/**
 * Extracts all serializable properties from userland schema types,
 * so they best-effort can be used as definitions for Schema.compile.
 *
 * @internal
 */ export async function extractManifestSchemaTypes(schema, workDir) {
    const typeNames = schema.getTypeNames();
    const context = {
        schema
    };
    const { createSchema } = await resolveLocalPackage('sanity', workDir);
    const studioDefaultTypeNames = createSchema({
        name: 'default',
        types: []
    }).getTypeNames();
    return typeNames.filter((typeName)=>!studioDefaultTypeNames.includes(typeName)).map((typeName)=>schema.get(typeName)).filter((type)=>type !== undefined).map((type)=>transformType(type, context));
}
/**
 * Extracts tool information from workspace tools
 */ const extractManifestTools = async (tools, workDir, resolveIcon)=>{
    return Promise.all(tools.map(async (tool)=>{
        const { __internalApplicationType: type, icon, name, title } = tool;
        return {
            icon: await resolveIcon({
                icon: icon,
                title,
                workDir
            }),
            name,
            title,
            type: type || null
        };
    }));
};

//# sourceMappingURL=extractWorkspaceManifest.js.map
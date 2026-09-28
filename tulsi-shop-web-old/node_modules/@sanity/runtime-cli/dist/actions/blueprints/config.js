import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { cwd } from 'node:process';
import config, { BLUEPRINT_CONFIG_DIR, BLUEPRINT_CONFIG_FILE, BLUEPRINT_CONFIG_VERSION, RUNTIME_CLI_VERSION, } from '../../config.js';
import { getProject } from '../sanity/projects.js';
import { listStacks } from './stacks.js';
export function readConfigFile(blueprintFilePath) {
    const blueprintDir = blueprintFilePath ? dirname(blueprintFilePath) : cwd();
    const configPath = join(blueprintDir, BLUEPRINT_CONFIG_DIR, BLUEPRINT_CONFIG_FILE);
    if (existsSync(configPath)) {
        try {
            const config = JSON.parse(readFileSync(configPath, 'utf8'));
            return { configPath, ...config };
        }
        catch {
            return null;
        }
    }
    return null;
}
/**
 * Create or update the config file to disk.
 * One of organizationId or projectId must be provided.
 * Blueprint config version and updatedAt timestamp are set automatically.
 * @param options - the options to write the config file
 * @param options.blueprintFilePath - the path to the blueprint file
 * @param options.organizationId - the organization ID
 * @param options.projectId - the project ID
 * @param options.stackId - the stack ID
 */
export function writeConfigFile(blueprintFilePath, options) {
    const { organizationId, projectId, stackId } = options;
    const blueprintDir = blueprintFilePath ? dirname(blueprintFilePath) : cwd();
    const configDir = join(blueprintDir, BLUEPRINT_CONFIG_DIR);
    const configPath = join(configDir, BLUEPRINT_CONFIG_FILE);
    if (!existsSync(configDir))
        mkdirSync(configDir, { recursive: true });
    let config = {};
    const existingConfig = readConfigFile(configPath);
    if (existingConfig)
        config = existingConfig;
    if (organizationId)
        config.organizationId = organizationId;
    if (projectId)
        config.projectId = projectId;
    if (stackId)
        config.stackId = stackId;
    config.blueprintConfigVersion = BLUEPRINT_CONFIG_VERSION;
    config.runtimeCliVersion = RUNTIME_CLI_VERSION;
    config.updatedAt = Date.now();
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    return config;
}
/**
 * Update the config file with the given properties.
 * Config file must already exist.
 * Adds timestamp. No ID combination validation.
 * @param blueprintFilePath - the path to the blueprint file
 * @param updateableProperties - the properties to update
 * @param updateableProperties.organizationId - the organization ID (null to remove)
 * @param updateableProperties.projectId - the project ID (null to remove)
 * @param updateableProperties.stackId - the stack ID (null to remove)
 */
export function patchConfigFile(blueprintFilePath, updateableProperties) {
    const existingConfig = readConfigFile(blueprintFilePath);
    if (!existingConfig)
        throw new Error('No config file found');
    return patchLocatedConfig(existingConfig, updateableProperties);
}
/**
 * Patch a known config using its `configPath`.
 * Unlike {@link patchConfigFile}, this does not re-derive the config location.
 * Adds timestamp. No ID combination validation.
 * @param existingConfig - the located config (includes `configPath`)
 * @param updateableProperties - the properties to update (null to remove)
 */
export function patchLocatedConfig(existingConfig, updateableProperties) {
    const { configPath, ...existingConfigProperties } = existingConfig;
    const merged = {
        blueprintConfigVersion: BLUEPRINT_CONFIG_VERSION, // patch doesn't overwrite versions
        runtimeCliVersion: RUNTIME_CLI_VERSION,
        ...existingConfigProperties,
        ...updateableProperties,
        updatedAt: Date.now(),
    };
    // remove value if set to null
    const newConfig = Object.fromEntries(Object.entries(merged).filter(([_, v]) => v !== null));
    writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    return newConfig;
}
/**
 * Find and write an organizationId to the config file by getting it from the projectId
 * @throws {Error} if unable to fetch project
 * @returns {Promise<string>} the discovered organizationId
 */
export async function backfillOrganizationId({ blueprintFilePath, projectId, logger, }) {
    const token = config.token;
    if (!token)
        throw new Error('No token found');
    let organizationId;
    try {
        const response = await getProject({ token, scopeType: 'project', scopeId: projectId, logger });
        if (!response.ok)
            throw new Error('Failed to get project');
        if (!response.project)
            throw new Error('No project found');
        organizationId = response.project.organizationId;
    }
    catch (error) {
        throw new Error('Failed to backfill organizationId', { cause: error });
    }
    if (!organizationId)
        throw new Error('No organizationId found');
    patchConfigFile(blueprintFilePath, { organizationId });
    return organizationId;
}
export async function backfillProjectBasedStackId({ blueprintFilePath, projectId, logger, }) {
    const token = config.token;
    if (!token)
        throw new Error('No token found');
    const possibleStackId = `ST-${projectId}`;
    // get stack count, if 1 and it's project-based, use it
    const { ok, stacks, error } = await listStacks({
        token,
        scopeType: 'project',
        scopeId: projectId,
    }, logger);
    if (!ok)
        throw new Error(error || 'Failed to list stacks');
    if (stacks.length === 1 &&
        stacks[0].scopeType === 'project' &&
        stacks[0].id === possibleStackId) {
        // jackpot
        patchConfigFile(blueprintFilePath, { projectId, stackId: possibleStackId });
        return possibleStackId;
    }
    return undefined;
}

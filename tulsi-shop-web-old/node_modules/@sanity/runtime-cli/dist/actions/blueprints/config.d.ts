import { BLUEPRINT_CONFIG_VERSION, RUNTIME_CLI_VERSION } from '../../config.js';
import type { Logger } from '../../utils/logger.js';
export interface ConfigUpdate {
    organizationId?: string;
    projectId?: string;
    stackId?: string;
}
export interface BlueprintsConfig extends ConfigUpdate {
    blueprintConfigVersion?: typeof BLUEPRINT_CONFIG_VERSION;
    runtimeCliVersion?: typeof RUNTIME_CLI_VERSION;
    updatedAt?: number;
}
export interface LocatedBlueprintsConfig extends BlueprintsConfig {
    configPath: string;
}
export declare function readConfigFile(blueprintFilePath?: string): LocatedBlueprintsConfig | null;
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
export declare function writeConfigFile(blueprintFilePath: string, options: {
    stackId?: string;
    organizationId?: string;
    projectId?: string;
}): BlueprintsConfig;
export interface ConfigPatch {
    organizationId?: string | null;
    projectId?: string | null;
    stackId?: string | null;
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
export declare function patchConfigFile(blueprintFilePath: string, updateableProperties: ConfigPatch): BlueprintsConfig;
/**
 * Patch a known config using its `configPath`.
 * Unlike {@link patchConfigFile}, this does not re-derive the config location.
 * Adds timestamp. No ID combination validation.
 * @param existingConfig - the located config (includes `configPath`)
 * @param updateableProperties - the properties to update (null to remove)
 */
export declare function patchLocatedConfig(existingConfig: LocatedBlueprintsConfig, updateableProperties: ConfigPatch): BlueprintsConfig;
/**
 * Find and write an organizationId to the config file by getting it from the projectId
 * @throws {Error} if unable to fetch project
 * @returns {Promise<string>} the discovered organizationId
 */
export declare function backfillOrganizationId({ blueprintFilePath, projectId, logger, }: {
    blueprintFilePath: string;
    projectId: string;
    logger: Logger;
}): Promise<string>;
export declare function backfillProjectBasedStackId({ blueprintFilePath, projectId, logger, }: {
    blueprintFilePath: string;
    projectId: string;
    logger: Logger;
}): Promise<string | undefined>;

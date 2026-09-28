import type { CoreResult, DeployedBlueprintConfig } from '../../index.js';
export interface FunctionEnvRemoveOptions extends DeployedBlueprintConfig {
    args: {
        name: string;
        key: string;
    };
}
export declare function functionEnvRemoveCore(options: FunctionEnvRemoveOptions): Promise<CoreResult>;

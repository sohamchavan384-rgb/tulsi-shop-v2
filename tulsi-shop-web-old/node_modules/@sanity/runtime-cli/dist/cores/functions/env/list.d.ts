import type { CoreResult, DeployedBlueprintConfig } from '../../index.js';
export interface FunctionEnvListOptions extends DeployedBlueprintConfig {
    args: {
        name: string;
    };
}
export declare function functionEnvListCore(options: FunctionEnvListOptions): Promise<CoreResult>;

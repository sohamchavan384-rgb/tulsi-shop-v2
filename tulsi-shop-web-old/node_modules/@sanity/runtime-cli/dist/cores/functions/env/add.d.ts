import type { CoreResult, DeployedBlueprintConfig } from '../../index.js';
export interface FunctionEnvAddOptions extends DeployedBlueprintConfig {
    args: {
        name: string;
        key: string;
        value: string;
    };
}
export declare function functionEnvAddCore(options: FunctionEnvAddOptions): Promise<CoreResult>;

import type { CoreResult, DeployedBlueprintConfig } from '../index.js';
export interface BlueprintPromoteOptions extends DeployedBlueprintConfig {
    flags: {
        force?: boolean;
        verbose?: boolean;
        'new-stack-name'?: string;
    };
}
export declare function blueprintPromoteCore(options: BlueprintPromoteOptions): Promise<CoreResult>;

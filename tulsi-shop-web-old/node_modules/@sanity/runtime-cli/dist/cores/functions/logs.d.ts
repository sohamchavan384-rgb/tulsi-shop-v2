import type { CoreResult, DeployedBlueprintConfig } from '../index.js';
export interface FunctionLogsOptions extends DeployedBlueprintConfig {
    args: {
        name: string | undefined;
    };
    flags: {
        limit: number;
        json?: boolean;
        utc?: boolean;
        delete?: boolean;
        force?: boolean;
        watch?: boolean;
    };
    error: (message: string, options: object) => void;
    helpText: string;
}
export declare function functionLogsCore(options: FunctionLogsOptions): Promise<CoreResult>;

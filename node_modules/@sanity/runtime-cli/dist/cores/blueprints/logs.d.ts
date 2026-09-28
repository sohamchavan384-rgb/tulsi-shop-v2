import type { AuthParams, Stack } from '../../utils/types.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface BlueprintLogsOptions extends CoreConfig {
    auth: AuthParams;
    stackId: string;
    deployedStack: Stack;
    flags: {
        watch?: boolean;
        verbose?: boolean;
        limit?: number;
        since?: string;
        before?: string;
    };
}
export declare function blueprintLogsCore(options: BlueprintLogsOptions): Promise<CoreResult>;

import type { Stack } from '../../utils/types.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface BlueprintInfoOptions extends CoreConfig {
    stackId: string;
    deployedStack: Stack;
    flags: {
        verbose?: boolean;
    };
}
export declare function blueprintInfoCore(options: BlueprintInfoOptions): Promise<CoreResult>;

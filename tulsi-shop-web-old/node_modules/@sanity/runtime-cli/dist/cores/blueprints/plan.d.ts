import type { ReadBlueprintResult } from '../../actions/blueprints/blueprint.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface BlueprintPlanOptions extends CoreConfig {
    blueprint: ReadBlueprintResult;
    token?: string;
    flags: {
        stack?: string;
        verbose?: boolean;
    };
}
export declare function blueprintPlanCore(options: BlueprintPlanOptions): Promise<CoreResult>;

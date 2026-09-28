import type { ReadBlueprintResult } from '../../actions/blueprints/blueprint.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface FunctionBuildOptions extends CoreConfig {
    blueprint: ReadBlueprintResult;
    args: {
        name: string | undefined;
    };
    flags: {
        'fn-installer'?: string;
        'out-dir'?: string;
    };
}
export declare function functionBuildCore(options: FunctionBuildOptions): Promise<CoreResult>;

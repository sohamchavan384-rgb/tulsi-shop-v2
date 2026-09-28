import type { ReadBlueprintResult } from '../../actions/blueprints/blueprint.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface FunctionAddOptions extends CoreConfig {
    blueprint: ReadBlueprintResult;
    flags: {
        example?: string;
        name?: string;
        type?: string | string[];
        language?: string;
        javascript?: boolean;
        helpers?: boolean;
        installer?: string;
        install?: boolean;
    };
}
export declare const generateFunctionBlueprintResourceTemplate: (fnName: string, eventNames: string[]) => string;
export declare function functionAddCore(options: FunctionAddOptions): Promise<CoreResult>;

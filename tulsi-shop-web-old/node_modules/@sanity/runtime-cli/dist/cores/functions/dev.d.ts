import type { CoreConfig, CoreResult } from '../index.js';
export interface FunctionDevOptions extends CoreConfig {
    flags: {
        host?: string;
        port?: number;
        timeout?: number;
    };
}
export declare function functionDevCore(options: FunctionDevOptions): Promise<CoreResult>;

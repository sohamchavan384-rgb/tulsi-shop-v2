import type { Logger } from '../../../utils/logger.js';
import type { AuthParams } from '../../../utils/types.js';
export declare function list(id: string, auth: AuthParams, logger: Logger): Promise<{
    ok: boolean;
    envvars: any;
    error: any;
}>;

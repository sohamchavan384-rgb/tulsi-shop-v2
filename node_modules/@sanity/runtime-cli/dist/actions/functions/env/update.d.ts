import type { Logger } from '../../../utils/logger.js';
import type { AuthParams } from '../../../utils/types.js';
export declare function update(id: string, key: string, value: string, auth: AuthParams, logger: Logger): Promise<{
    ok: boolean;
    error: any;
}>;

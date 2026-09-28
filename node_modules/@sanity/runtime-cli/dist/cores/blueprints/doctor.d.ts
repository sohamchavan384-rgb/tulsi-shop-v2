import type { CoreConfig, CoreResult } from '../index.js';
export interface BlueprintDoctorOptions extends CoreConfig {
    token: string | null;
    flags: {
        verbose?: boolean;
        path?: string;
        fix?: boolean;
    };
}
export declare function blueprintDoctorCore(options: BlueprintDoctorOptions): Promise<CoreResult>;

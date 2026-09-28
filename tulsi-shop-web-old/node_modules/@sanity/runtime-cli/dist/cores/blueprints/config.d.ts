import type { BlueprintConfig, CoreResult } from '../index.js';
export interface BlueprintConfigOptions extends BlueprintConfig {
    flags: {
        edit?: boolean;
        'project-id'?: string;
        'organization-id'?: string;
        stack?: string;
        verbose?: boolean;
    };
}
export declare function blueprintConfigCore(options: BlueprintConfigOptions): Promise<CoreResult>;

import type { AuthParams, ScopeType } from '../../utils/types.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface BlueprintMintDeployTokenOptions extends CoreConfig {
    auth: AuthParams;
    scopeType: ScopeType;
    scopeId: string;
    flags: {
        label?: string;
        print?: boolean;
        json?: boolean;
        verbose?: boolean;
    };
}
export declare function isRoleUnavailableError(error: string): boolean;
export declare function defaultLabel(scopeType: ScopeType): string;
export declare function blueprintMintDeployTokenCore(options: BlueprintMintDeployTokenOptions): Promise<CoreResult>;

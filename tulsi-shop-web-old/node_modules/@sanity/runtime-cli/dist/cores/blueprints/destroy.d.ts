import { type LocatedBlueprintsConfig } from '../../actions/blueprints/config.js';
import type { ScopeType } from '../../utils/types.js';
import type { CoreConfig, CoreResult } from '../index.js';
export interface BlueprintDestroyOptions extends CoreConfig {
    token: string;
    /** Scope to destroy within, resolved by the base command (flags > env > config). */
    scopeType?: ScopeType;
    scopeId?: string;
    /** Locally-configured Stack ID, used when no --stack override is provided. */
    localStackId?: string;
    /** Located local config, used to unset stackId after a successful destroy. */
    blueprintConfig?: LocatedBlueprintsConfig | null;
    flags: {
        force?: boolean;
        'project-id'?: string;
        'organization-id'?: string;
        stack?: string;
        'no-wait'?: boolean;
        verbose?: boolean;
    };
}
export declare function blueprintDestroyCore(options: BlueprintDestroyOptions): Promise<CoreResult>;

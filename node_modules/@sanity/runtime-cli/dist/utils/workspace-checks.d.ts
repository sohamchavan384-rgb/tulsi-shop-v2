import type { WarningCode } from './warnings.js';
/**
 * Shared utility called by functions or blueprints to deterministically show warnings to users if it's not ideal
 * 1. Checks to see if the given filepath is in a studio specific workspace
 * 2. Checks to see if the given filepath is under a functions directory (/functions/sanity.blueprint.ts)
 * 3. Checks to see if the given filepath is in a self-contained directory (/blueprints/my-blueprint/sanity.blueprint.ts)
 * @param filePath
 */
export declare const checkWorkspaceStruct: (filePath: string) => WarningCode | undefined;

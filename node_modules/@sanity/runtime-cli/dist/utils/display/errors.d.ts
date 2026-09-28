import type { BlueprintParserError } from '../types.js';
export type BlueprintIssue = {
    code: 'NO_STACK_ID' | 'NO_SCOPE_TYPE' | 'NO_SCOPE_ID' | 'NO_STACK' | 'PARSE_ERROR';
    message: string;
    errors?: BlueprintParserError[];
};
export declare function presentBlueprintIssues(issues: BlueprintIssue[]): string;
export declare function presentBlueprintParserErrors(errors: BlueprintParserError[]): string;

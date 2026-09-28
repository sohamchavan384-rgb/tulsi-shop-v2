import type { Warning } from './types.js';
export type WarningCode = 'studio' | 'floating' | 'functions';
export type WarningContext = {
    dir: string;
};
export type WarningType = {
    code: WarningCode;
    suggestions: string[];
};
/**
 * Generates warnings based upon the provided context by running through all rules and returning any matches
 * @param ctx
 */
export declare const getWarnings: (ctx: WarningContext) => Warning[];

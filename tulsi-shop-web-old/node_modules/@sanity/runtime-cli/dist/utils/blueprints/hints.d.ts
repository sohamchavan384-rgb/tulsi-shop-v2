import type { BlueprintLog } from '../types.js';
/**
 * A pattern that matches a message and produces oclif suggestions.
 * Capture groups are forwarded to the factory so suggestions can include dynamic values.
 */
type HintPattern = [RegExp, (match: RegExpMatchArray, bin: string) => string[]];
/**
 * Patterns matched against ERROR/FATAL log entries during streaming operations
 * like deploy and destroy. Each entry is a [regex, suggestionFactory] tuple.
 *
 * Add new patterns here -- no other code changes required.
 */
export declare const HINT_PATTERNS: HintPattern[];
/**
 * Creates a collector to create suggestions
 * Use getSuggestions() after all logs are inspected
 */
export declare function createHintCollector(bin: string): {
    /** Check a log entry against hint patterns; only ERROR/FATAL levels are inspected. */
    inspectLog(log: BlueprintLog): void;
    inspectMessage(message: string): void;
    /** Return unique collected suggestions. */
    getSuggestions(): string[];
};
export {};

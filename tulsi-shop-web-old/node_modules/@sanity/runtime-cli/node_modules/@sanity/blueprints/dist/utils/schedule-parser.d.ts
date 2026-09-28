import type { BlueprintError } from '../types/errors.js';
/**
 * Validates a scheduled expression and returns any errors found.
 *
 * Checks for:
 * - Empty expressions
 * - Invalid time formats (hours, minutes out of range)
 * - Invalid intervals (minutes, hours out of range)
 * - Invalid day of month values
 * - Unrecognizable expressions
 *
 * @param expression Natural language scheduled or cron expression
 * @returns Array of validation errors, empty if valid
 * @internal
 */
export declare function validateScheduledExpression(expression: string): BlueprintError[];
/**
 * Parse a natural language scheduled expression into a cron expression.
 *
 * The parser is **forgiving** and **freeform** - it extracts recognized parts
 * (days, times, intervals) and ignores unrecognized tokens like "at", "on", "the".
 *
 * Supported patterns:
 * - "every minute", "every 5 minutes", "every hour", "every 2 hours"
 * - "every day at 9am", "daily 14:30", "9am daily"
 * - "at midnight", "noon"
 * - "morning", "evening"
 * - "mondays 9am", "mon wed fri 9:00", "mon-fri 8am"
 * - "9pm fridays and wed", "wednesday friday 9pm"
 * - "weekdays 9am", "weekends 10am"
 * - "first of the month 9am", "15th noon"
 *
 * If the input is already a valid cron expression, it is returned unchanged.
 *
 * This function assumes the expression has already been validated via
 * `validateScheduledExpression`. For invalid input, behavior is undefined.
 *
 * @param expression Natural language scheduled or cron expression
 * @returns Cron expression string
 * @internal
 */
export declare function parseScheduledExpression(expression: string): string;

import {
  type BlueprintScheduledFunctionConfig,
  type BlueprintScheduledFunctionConfigEvent,
  type BlueprintScheduledFunctionExplicitResourceEvent,
  type BlueprintScheduledFunctionExpressionResourceEvent,
  type BlueprintScheduledFunctionResource,
  type BlueprintScheduledFunctionResourceEvent,
  validateScheduledFunction,
} from '../../index.js'
import {parseScheduledExpression} from '../../utils/schedule-parser.js'
import {runValidation} from '../../utils/validation.js'
import {defineFunction} from './index.js'

type ScheduledFunctionEventKey =
  | keyof BlueprintScheduledFunctionExplicitResourceEvent
  | keyof BlueprintScheduledFunctionExpressionResourceEvent
const SCHEDULED_EVENT_KEYS = new Set<ScheduledFunctionEventKey>(['minute', 'hour', 'dayOfWeek', 'month', 'dayOfMonth', 'expression'])

/**
 * Defines a function that is triggered on a schedule.
 * Supports cron expressions or natural language schedules.
 *
 * @remarks
 * Using a cron expression:
 * ```ts
 * defineScheduledFunction({
 *   name: 'daily-cleanup',
 *   event: {expression: '0 9 * * *'},
 * })
 * ```
 *
 * Using explicit cron fields:
 * ```ts
 * defineScheduledFunction({
 *   name: 'daily-cleanup',
 *   event: {minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '*'},
 * })
 * ```
 *
 * The `event.expression` field accepts standard cron expressions or natural language:
 * `'every 15 minutes'`, `'weekdays at 8am'`, `'fridays in the evening'`,
 * `'mon, wed, fri at 9am'`, `'first of the month at noon'`
 *
 * ```ts
 * defineScheduledFunction({
 *   name: 'daily-cleanup',
 *   event: {expression: 'every day at 9am'},
 * })
 * ```
 * @public
 * @alpha Deploying Scheduled Functions via Blueprints is experimental. This feature is not available publicly yet.
 * @hidden
 * @category Definers
 * @expandType BlueprintScheduledFunctionConfig
 * @param functionConfig The configuration for the scheduled function
 * @returns The validated scheduled function resource
 */
export function defineScheduledFunction(functionConfig: BlueprintScheduledFunctionConfig): BlueprintScheduledFunctionResource {
  const {event, timezone} = functionConfig

  const functionResource: BlueprintScheduledFunctionResource = {
    ...defineFunction(functionConfig, {skipValidation: true, scopeType: 'organization'}),
    type: 'sanity.function.cron',
    event: buildScheduledFunctionEvent(event),
  }

  if (timezone) functionResource.timezone = timezone

  // Always normalize to explicit fields (minute, hour, dayOfWeek, month, dayOfMonth)
  if ('expression' in functionResource.event && typeof functionResource.event.expression === 'string') {
    const cron = parseScheduledExpression(functionResource.event.expression)
    functionResource.event = cronStringToExplicitEvent(cron)
  }

  runValidation(() => validateScheduledFunction(functionResource))

  return functionResource
}

/**
 * @deprecated Define scheduled functions using `defineScheduledFunction` instead
 * @hidden
 */
export function defineScheduleFunction(functionConfig: BlueprintScheduledFunctionConfig): BlueprintScheduledFunctionResource {
  return defineScheduledFunction(functionConfig)
}

/**
 * Builds a scheduled function event configuration.
 * Filters out non-event properties. Does not parse expressions.
 * @param event Scheduled function event configuration
 * @returns Cleaned scheduled function event configuration
 */
function buildScheduledFunctionEvent(event: BlueprintScheduledFunctionConfigEvent): BlueprintScheduledFunctionResourceEvent {
  return Object.fromEntries(
    Object.entries(event).filter(([key]) => SCHEDULED_EVENT_KEYS.has(key as ScheduledFunctionEventKey)),
  ) as BlueprintScheduledFunctionResourceEvent
}

/**
 * Converts a cron expression string (minute hour dayOfMonth month dayOfWeek) to explicit event fields.
 * @param cron Cron string with five space-separated fields
 * @returns Explicit scheduled event with minute, hour, dayOfMonth, month, dayOfWeek
 */
function cronStringToExplicitEvent(cron: string): BlueprintScheduledFunctionExplicitResourceEvent {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) {
    throw new Error(`Invalid cron string: expected 5 fields, got ${parts.length}`)
  }
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  return {minute, hour, dayOfMonth, month, dayOfWeek}
}

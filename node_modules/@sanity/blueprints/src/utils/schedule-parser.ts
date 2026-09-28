import type {BlueprintError} from '../types/errors.js'

/**
 * Day of week mappings (cron uses 0=Sunday, 1=Monday, etc.)
 */
const DAYS_OF_WEEK: Record<string, number> = {
  sunday: 0,
  sun: 0,
  su: 0,
  monday: 1,
  mon: 1,
  mo: 1,
  tuesday: 2,
  tue: 2,
  tu: 2,
  wednesday: 3,
  wed: 3,
  we: 3,
  thursday: 4,
  thu: 4,
  th: 4,
  friday: 5,
  fri: 5,
  fr: 5,
  saturday: 6,
  sat: 6,
  sa: 6,
}

/**
 * Named time mappings (hour, minute)
 */
const NAMED_TIMES: Record<string, {hour: number; minute: number}> = {
  midnight: {hour: 0, minute: 0},
  noon: {hour: 12, minute: 0},
  midday: {hour: 12, minute: 0},
  morning: {hour: 9, minute: 0},
  afternoon: {hour: 14, minute: 0},
  evening: {hour: 18, minute: 0},
}

/**
 * Noise words to ignore during parsing
 */
const NOISE_WORDS = new Set(['every', 'at', 'on', 'the', 'of', 'in', 'and', 'to'])

/**
 * Check if a string looks like a cron expression
 */
function isCronExpression(expr: string): boolean {
  return /^[\d*,/-]+(\s+[\d*,/-]+){4}$/.test(expr.trim())
}

/**
 * Result from trying to parse a time token
 */
type TimeParseResult = {success: true; hour: number; minute: number} | {success: false; error: BlueprintError} | {success: null} // not a time pattern

/**
 * Try to parse a token as a time
 */
function tryParseTime(token: string): TimeParseResult {
  const normalized = token.toLowerCase().replace(/\s+/g, '')

  // Check named times
  if (normalized in NAMED_TIMES) {
    return {success: true, ...NAMED_TIMES[normalized]}
  }

  // Just :MM format (e.g., "every hour at :30")
  const minuteOnly = normalized.match(/^:(\d{1,2})$/)
  if (minuteOnly) {
    const minute = parseInt(minuteOnly[1], 10)
    if (minute < 0 || minute > 59) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid time: minute must be 0-59, got \`${minute}\``},
      }
    }
    return {success: true, hour: -1, minute} // -1 signals "use current hour context"
  }

  // 12-hour format: 9am, 9:30am, 9:30pm
  const match12hr = normalized.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/)
  if (match12hr) {
    const hourRaw = parseInt(match12hr[1], 10)
    const minute = match12hr[2] ? parseInt(match12hr[2], 10) : 0
    const period = match12hr[3]

    if (hourRaw < 1 || hourRaw > 12) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid time: hour must be 1-12 for 12-hour format, got \`${hourRaw}\``},
      }
    }
    if (minute < 0 || minute > 59) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid time: minute must be 0-59, got \`${minute}\``},
      }
    }

    let hour = hourRaw
    if (period === 'am') {
      hour = hour === 12 ? 0 : hour
    } else {
      hour = hour === 12 ? 12 : hour + 12
    }

    return {success: true, hour, minute}
  }

  // 24-hour format: 14:30, 09:00
  const match24hr = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (match24hr) {
    const hour = parseInt(match24hr[1], 10)
    const minute = parseInt(match24hr[2], 10)

    if (hour < 0 || hour > 23) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid time: hour must be 0-23 for 24-hour format, got \`${hour}\``},
      }
    }
    if (minute < 0 || minute > 59) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid time: minute must be 0-59, got \`${minute}\``},
      }
    }

    return {success: true, hour, minute}
  }

  return {success: null}
}

/**
 * Try to parse two tokens as a time (e.g., "9" + "am" or "9:30" + "am")
 */
function tryParseTwoTokenTime(token1: string, token2: string): TimeParseResult {
  const combined = token1 + token2
  return tryParseTime(combined)
}

/**
 * Try to parse a token as a day of week
 */
function tryParseDay(token: string): number | null {
  const normalized = token.toLowerCase().replace(/s$/, '') // Remove trailing 's' for plurals
  if (normalized in DAYS_OF_WEEK) {
    return DAYS_OF_WEEK[normalized]
  }
  return null
}

/**
 * Try to parse a day range like "mon-wed" or "monday-friday"
 */
function tryParseDayRange(token: string): number[] | null {
  const match = token.toLowerCase().match(/^(\w+)-(\w+)$/)
  if (!match) return null

  const startDay = tryParseDay(match[1])
  const endDay = tryParseDay(match[2])

  if (startDay === null || endDay === null) return null

  // Build range
  const days: number[] = []
  if (startDay <= endDay) {
    for (let d = startDay; d <= endDay; d++) days.push(d)
  } else {
    // Wrap around (e.g., fri-mon = 5,6,0,1)
    for (let d = startDay; d <= 6; d++) days.push(d)
    for (let d = 0; d <= endDay; d++) days.push(d)
  }
  return days
}

/**
 * Result from trying to parse an ordinal
 */
type OrdinalParseResult = {success: true; value: number} | {success: false; error: BlueprintError} | {success: null} // not an ordinal pattern

/**
 * Try to parse an ordinal day of month (1st, 2nd, 15th, etc.)
 */
function tryParseOrdinal(token: string): OrdinalParseResult {
  const match = token.match(/^(\d+)(?:st|nd|rd|th)$/)
  if (!match) return {success: null}
  const num = parseInt(match[1], 10)
  if (num < 1 || num > 31) {
    return {
      success: false,
      error: {type: 'invalid_value', message: `Invalid day of month: must be 1-31, got \`${num}\``},
    }
  }
  return {success: true, value: num}
}

/**
 * Result from trying to parse an interval
 */
type IntervalParseResult =
  | {success: true; type: 'minute' | 'hour'; value: number; consumed: number}
  | {success: false; error: BlueprintError}
  | {success: null} // not an interval pattern

/**
 * Try to parse interval like "5 minutes" or "2 hours" from consecutive tokens
 */
function tryParseInterval(tokens: string[], index: number): IntervalParseResult {
  if (index >= tokens.length - 1) return {success: null}

  const num = parseInt(tokens[index], 10)
  if (Number.isNaN(num)) return {success: null}

  const unit = tokens[index + 1].toLowerCase()
  if (unit === 'minute' || unit === 'minutes') {
    if (num < 1 || num > 59) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid interval: minutes must be 1-59, got \`${num}\``},
      }
    }
    return {success: true, type: 'minute', value: num, consumed: 2}
  }
  if (unit === 'hour' || unit === 'hours') {
    if (num < 1 || num > 23) {
      return {
        success: false,
        error: {type: 'invalid_value', message: `Invalid interval: hours must be 1-23, got \`${num}\``},
      }
    }
    return {success: true, type: 'hour', value: num, consumed: 2}
  }
  return {success: null}
}

/**
 * Internal parsing logic shared between validate and parse functions
 */
function parseExpressionInternal(expression: string): {
  errors: BlueprintError[]
  cron: string | null
} {
  const errors: BlueprintError[] = []
  const trimmed = expression.trim()

  // If it's already a cron expression, return as-is
  if (isCronExpression(trimmed)) {
    return {errors: [], cron: trimmed}
  }

  // Normalize and tokenize
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ')
  // Split on spaces and commas, keep hyphenated tokens together
  const rawTokens = normalized.split(/[\s,]+/).filter(Boolean)

  // Extract components
  let time: {hour: number; minute: number} | null = null
  const days: number[] = []
  let dayOfMonth: number | null = null
  let interval: {type: 'minute' | 'hour'; value: number} | null = null
  let hasWeekdays = false
  let hasWeekends = false
  let hasDaily = false
  let hasMinute = false
  let hasHour = false

  // Check for special keywords in original normalized string
  if (/\bweekdays?\b/.test(normalized)) hasWeekdays = true
  if (/\bweekends?\b/.test(normalized)) hasWeekends = true
  if (/\bdaily\b/.test(normalized) || /\bevery\s+day\b/.test(normalized)) hasDaily = true
  if (/\bevery\s+minute\b/.test(normalized) || /\bminutely\b/.test(normalized)) hasMinute = true
  if (/\bevery\s+hour\b/.test(normalized) || /\bhourly\b/.test(normalized)) hasHour = true
  if (/\bfirst\b/.test(normalized) && /\bmonth\b/.test(normalized)) dayOfMonth = 1

  // Process tokens
  let i = 0
  while (i < rawTokens.length) {
    const token = rawTokens[i]

    // Skip noise words
    if (NOISE_WORDS.has(token) || token === 'day' || token === 'month') {
      i++
      continue
    }

    // Try interval (e.g., "5 minutes")
    const parsedInterval = tryParseInterval(rawTokens, i)
    if (parsedInterval.success === true) {
      interval = {type: parsedInterval.type, value: parsedInterval.value}
      i += parsedInterval.consumed
      continue
    } else if (parsedInterval.success === false) {
      errors.push(parsedInterval.error)
      i += 2 // skip past the invalid interval
      continue
    }

    // Try two-token time first (e.g., "9" + "am" or "9:30" + "pm")
    if (i < rawTokens.length - 1) {
      const twoTokenTime = tryParseTwoTokenTime(token, rawTokens[i + 1])
      if (twoTokenTime.success === true) {
        time = {hour: twoTokenTime.hour, minute: twoTokenTime.minute}
        i += 2
        continue
      } else if (twoTokenTime.success === false) {
        errors.push(twoTokenTime.error)
        i += 2
        continue
      }
    }

    // Try single-token time
    const parsedTime = tryParseTime(token)
    if (parsedTime.success === true) {
      // Handle :MM format (minute only)
      if (parsedTime.hour === -1) {
        time = {hour: time?.hour ?? 0, minute: parsedTime.minute}
      } else {
        time = {hour: parsedTime.hour, minute: parsedTime.minute}
      }
      i++
      continue
    } else if (parsedTime.success === false) {
      errors.push(parsedTime.error)
      i++
      continue
    }

    // Try day range (mon-fri)
    const dayRange = tryParseDayRange(token)
    if (dayRange) {
      for (const d of dayRange) {
        if (!days.includes(d)) days.push(d)
      }
      i++
      continue
    }

    // Try single day
    const parsedDay = tryParseDay(token)
    if (parsedDay !== null) {
      if (!days.includes(parsedDay)) {
        days.push(parsedDay)
      }
      i++
      continue
    }

    // Try ordinal (1st, 15th)
    const ordinal = tryParseOrdinal(token)
    if (ordinal.success === true) {
      dayOfMonth = ordinal.value
      i++
      continue
    } else if (ordinal.success === false) {
      errors.push(ordinal.error)
      i++
      continue
    }

    // Try named time period (morning, evening, etc.)
    if (token in NAMED_TIMES) {
      time = NAMED_TIMES[token]
      i++
      continue
    }

    // Unrecognized token - skip (forgiving)
    i++
  }

  // Build cron expression
  // Format: minute hour dayOfMonth month dayOfWeek

  // Handle interval patterns
  if (interval) {
    if (interval.type === 'minute') {
      return {errors, cron: `*/${interval.value} * * * *`}
    }
    if (interval.type === 'hour') {
      return {errors, cron: `0 */${interval.value} * * *`}
    }
  }

  // Handle every minute
  if (hasMinute) {
    return {errors, cron: '* * * * *'}
  }

  // Handle every hour
  if (hasHour) {
    const minute = time?.minute ?? 0
    return {errors, cron: `${minute} * * * *`}
  }

  // Determine day of week field
  let dayOfWeekField = '*'
  if (hasWeekdays) {
    dayOfWeekField = '1-5'
  } else if (hasWeekends) {
    dayOfWeekField = '0,6'
  } else if (days.length > 0) {
    const uniqueDays = [...new Set(days)].sort((a, b) => a - b)
    dayOfWeekField = uniqueDays.join(',')
  }

  // Determine day of month field
  const dayOfMonthField = dayOfMonth !== null ? String(dayOfMonth) : '*'

  // If we have a day of month, reset day of week (unless explicitly set)
  if (dayOfMonth !== null && days.length === 0 && !hasWeekdays && !hasWeekends) {
    dayOfWeekField = '*'
  }

  // Determine time
  const minute = time?.minute ?? 0
  const hour = time?.hour ?? 0

  // Validate we have something meaningful
  const hasAnySchedule = time || days.length > 0 || hasWeekdays || hasWeekends || hasDaily || dayOfMonth !== null
  if (!hasAnySchedule) {
    // Only add generic "could not parse" if we don't already have specific errors
    if (errors.length === 0) {
      errors.push({
        type: 'invalid_value',
        message: `Could not parse scheduled expression \`${trimmed}\``,
      })
    }
    return {errors, cron: null}
  }

  return {errors, cron: `${minute} ${hour} ${dayOfMonthField} * ${dayOfWeekField}`}
}

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
export function validateScheduledExpression(expression: string): BlueprintError[] {
  if (!expression || expression.trim() === '') {
    return [{type: 'invalid_value', message: '`expression` cannot be empty'}]
  }

  const result = parseExpressionInternal(expression)
  return result.errors
}

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
export function parseScheduledExpression(expression: string): string {
  const trimmed = expression.trim()

  // Fast path for cron expressions
  if (isCronExpression(trimmed)) {
    return trimmed
  }

  const result = parseExpressionInternal(expression)
  if (!result.cron) {
    // Should never happen if validateScheduledExpression was called first
    throw new Error(`Failed to parse schedule expression: ${expression}`)
  }
  return result.cron
}

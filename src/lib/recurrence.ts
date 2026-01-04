import { RRule, Weekday } from 'rrule';

// Map from JavaScript day-of-week (0=Sunday) to RRule Weekday
const JS_TO_RRULE_WEEKDAY: Record<number, Weekday> = {
  0: RRule.SU,
  1: RRule.MO,
  2: RRule.TU,
  3: RRule.WE,
  4: RRule.TH,
  5: RRule.FR,
  6: RRule.SA,
};

// Map from RRule weekday number (0=Monday) to day name
const RRULE_WEEKDAY_NAMES: Record<number, string> = {
  0: 'Mon',
  1: 'Tue',
  2: 'Wed',
  3: 'Thu',
  4: 'Fri',
  5: 'Sat',
  6: 'Sun',
};

/**
 * Format a date as RRULE DTSTART format (YYYYMMDDTHHMMSSZ)
 */
function formatDtstart(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Get the next occurrence date after the given date
 */
export function getNextOccurrence(
  rule: string,
  afterDate: Date,
  endDate?: Date | null
): Date | null {
  try {
    // Add DTSTART to the rule if not present to establish the recurrence pattern start
    let fullRule = rule;
    if (!rule.includes('DTSTART')) {
      fullRule = `DTSTART=${formatDtstart(afterDate)};${rule}`;
    }

    const rrule = RRule.fromString(fullRule);

    // Get next occurrence after the given date (exclusive)
    const next = rrule.after(afterDate, false);

    if (!next) return null;

    // Check if past end date
    if (endDate && next > endDate) {
      return null;
    }

    return next;
  } catch (error) {
    console.error('Error parsing recurrence rule:', error);
    return null;
  }
}

/**
 * Parse RRULE string into components
 */
export function parseRecurrenceRule(rule: string): {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  weekdays?: number[];
  dayOfMonth?: number;
} | null {
  try {
    const rrule = RRule.fromString(rule);
    const options = rrule.origOptions;

    let frequency: 'daily' | 'weekly' | 'monthly';
    switch (options.freq) {
      case RRule.DAILY:
        frequency = 'daily';
        break;
      case RRule.WEEKLY:
        frequency = 'weekly';
        break;
      case RRule.MONTHLY:
        frequency = 'monthly';
        break;
      default:
        return null;
    }

    const result: ReturnType<typeof parseRecurrenceRule> = {
      frequency,
      interval: options.interval || 1,
    };

    if (options.byweekday) {
      const weekdays = Array.isArray(options.byweekday)
        ? options.byweekday
        : [options.byweekday];
      result.weekdays = weekdays.map((wd) => {
        if (typeof wd === 'number') return wd;
        if (typeof wd === 'string') {
          // WeekdayStr like 'MO', 'TU', etc.
          const weekdayMap: Record<string, number> = {
            MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6
          };
          return weekdayMap[wd] ?? 0;
        }
        // Weekday object with .weekday property
        return (wd as Weekday).weekday;
      });
    }

    if (options.bymonthday) {
      const days = Array.isArray(options.bymonthday)
        ? options.bymonthday
        : [options.bymonthday];
      result.dayOfMonth = days[0];
    }

    return result;
  } catch (error) {
    console.error('Error parsing recurrence rule:', error);
    return null;
  }
}

/**
 * Create RRULE string from components
 */
export function createRecurrenceRule(options: {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  weekdays?: number[];
  dayOfMonth?: number;
}): string {
  const parts: string[] = [];

  // Frequency
  switch (options.frequency) {
    case 'daily':
      parts.push('FREQ=DAILY');
      break;
    case 'weekly':
      parts.push('FREQ=WEEKLY');
      break;
    case 'monthly':
      parts.push('FREQ=MONTHLY');
      break;
  }

  // Interval
  if (options.interval && options.interval > 1) {
    parts.push(`INTERVAL=${options.interval}`);
  }

  // Weekdays (for weekly)
  if (options.weekdays && options.weekdays.length > 0) {
    const dayNames = options.weekdays.map((d) => {
      const weekday = JS_TO_RRULE_WEEKDAY[d];
      return weekday.toString();
    });
    parts.push(`BYDAY=${dayNames.join(',')}`);
  }

  // Day of month (for monthly)
  if (options.dayOfMonth !== undefined) {
    parts.push(`BYMONTHDAY=${options.dayOfMonth}`);
  }

  return parts.join(';');
}

/**
 * Format RRULE into human-readable string
 */
export function formatRecurrenceRule(rule: string): string {
  return getRecurrenceDescription(rule);
}

/**
 * Get human-readable description of recurrence rule
 */
export function getRecurrenceDescription(rule: string): string {
  const parsed = parseRecurrenceRule(rule);
  if (!parsed) return 'Custom';

  const { frequency, interval, weekdays, dayOfMonth } = parsed;

  // Handle interval
  if (interval > 1) {
    switch (frequency) {
      case 'daily':
        return `Every ${interval} days`;
      case 'weekly':
        return `Every ${interval} weeks`;
      case 'monthly':
        return `Every ${interval} months`;
    }
  }

  // Handle specific patterns
  switch (frequency) {
    case 'daily':
      return 'Daily';
    case 'weekly':
      if (weekdays && weekdays.length > 0) {
        // weekdays from parseRecurrenceRule are in RRule format (0=Monday)
        const dayNames = weekdays
          .sort((a, b) => a - b)
          .map((d) => RRULE_WEEKDAY_NAMES[d]);
        return `Weekly on ${dayNames.join(', ')}`;
      }
      return 'Weekly';
    case 'monthly':
      if (dayOfMonth !== undefined) {
        if (dayOfMonth === -1) {
          return 'Monthly on last day';
        }
        return `Monthly on day ${dayOfMonth}`;
      }
      return 'Monthly';
    default:
      return 'Custom';
  }
}

/**
 * Preset recurrence rules
 */
export const RECURRENCE_PRESETS = {
  none: null,
  daily: 'FREQ=DAILY',
  weekly: 'FREQ=WEEKLY',
  monthly: 'FREQ=MONTHLY',
} as const;

export type RecurrencePreset = keyof typeof RECURRENCE_PRESETS;

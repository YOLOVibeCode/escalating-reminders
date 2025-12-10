/**
 * Natural language date/time parser.
 * Parses user-friendly phrases like "next Friday", "in 2 hours", "tomorrow at 3pm"
 * into Date objects.
 */

export interface ParsedDateTime {
  date: Date;
  isValid: boolean;
  originalText: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Parse natural language date/time expressions.
 * Examples:
 * - "next Friday"
 * - "in 2 hours"
 * - "tomorrow at 3pm"
 * - "next week"
 * - "in 30 minutes"
 * - "Friday at 5pm"
 */
export function parseNaturalLanguageDateTime(
  text: string,
  referenceDate: Date = new Date(),
): ParsedDateTime {
  const normalized = text.trim().toLowerCase();
  const result: ParsedDateTime = {
    date: new Date(referenceDate),
    isValid: false,
    originalText: text,
    confidence: 'low',
  };

  // "in X minutes/hours/days/weeks"
  const inPattern = /^in\s+(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)$/i;
  const inMatch = normalized.match(inPattern);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2].toLowerCase();
    const date = new Date(referenceDate);

    switch (unit) {
      case 'minute':
      case 'minutes':
        date.setMinutes(date.getMinutes() + amount);
        break;
      case 'hour':
      case 'hours':
        date.setHours(date.getHours() + amount);
        break;
      case 'day':
      case 'days':
        date.setDate(date.getDate() + amount);
        break;
      case 'week':
      case 'weeks':
        date.setDate(date.getDate() + amount * 7);
        break;
      case 'month':
      case 'months':
        date.setMonth(date.getMonth() + amount);
        break;
    }

    result.date = date;
    result.isValid = true;
    result.confidence = 'high';
    return result;
  }

  // "next [day of week]"
  const nextDayPattern = /^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
  const nextDayMatch = normalized.match(nextDayPattern);
  if (nextDayMatch) {
    const dayName = nextDayMatch[1];
    const dayIndex = getDayIndex(dayName);
    const date = getNextWeekday(referenceDate, dayIndex);

    result.date = date;
    result.isValid = true;
    result.confidence = 'high';
    return result;
  }

  // "this [day of week]"
  const thisDayPattern = /^this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
  const thisDayMatch = normalized.match(thisDayPattern);
  if (thisDayMatch) {
    const dayName = thisDayMatch[1];
    const dayIndex = getDayIndex(dayName);
    const date = getThisWeekday(referenceDate, dayIndex);

    result.date = date;
    result.isValid = true;
    result.confidence = 'high';
    return result;
  }

  // "tomorrow"
  if (normalized === 'tomorrow') {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 1);
    result.date = date;
    result.isValid = true;
    result.confidence = 'high';
    return result;
  }

  // "tomorrow at [time]"
  const tomorrowAtPattern = /^tomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const tomorrowAtMatch = normalized.match(tomorrowAtPattern);
  if (tomorrowAtMatch) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 1);
    const timeResult = parseTime(tomorrowAtMatch[1], tomorrowAtMatch[2], tomorrowAtMatch[3]);
    if (timeResult.isValid) {
      date.setHours(timeResult.hours, timeResult.minutes, 0, 0);
      result.date = date;
      result.isValid = true;
      result.confidence = 'high';
      return result;
    }
  }

  // "[day of week] at [time]"
  const dayAtPattern = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
  const dayAtMatch = normalized.match(dayAtPattern);
  if (dayAtMatch) {
    const dayName = dayAtMatch[1];
    const dayIndex = getDayIndex(dayName);
    const date = getNextWeekday(referenceDate, dayIndex);
    const timeResult = parseTime(dayAtMatch[2], dayAtMatch[3], dayAtMatch[4]);
    if (timeResult.isValid) {
      date.setHours(timeResult.hours, timeResult.minutes, 0, 0);
      result.date = date;
      result.isValid = true;
      result.confidence = 'high';
      return result;
    }
  }

  // "next week"
  if (normalized === 'next week') {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 7);
    result.date = date;
    result.isValid = true;
    result.confidence = 'medium';
    return result;
  }

  return result;
}

/**
 * Get day index (0 = Sunday, 1 = Monday, etc.)
 */
function getDayIndex(dayName: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[dayName.toLowerCase()] ?? 0;
}

/**
 * Get next occurrence of a weekday.
 */
function getNextWeekday(referenceDate: Date, targetDayIndex: number): Date {
  const date = new Date(referenceDate);
  const currentDay = date.getDay();
  let daysUntilTarget = targetDayIndex - currentDay;

  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Next week
  }

  date.setDate(date.getDate() + daysUntilTarget);
  return date;
}

/**
 * Get this week's occurrence of a weekday (or next if already passed).
 */
function getThisWeekday(referenceDate: Date, targetDayIndex: number): Date {
  const date = new Date(referenceDate);
  const currentDay = date.getDay();
  let daysUntilTarget = targetDayIndex - currentDay;

  if (daysUntilTarget < 0) {
    daysUntilTarget += 7; // Next week
  }

  date.setDate(date.getDate() + daysUntilTarget);
  return date;
}

/**
 * Parse time string (e.g., "3pm", "15:30", "3:30pm").
 */
function parseTime(
  hourStr: string,
  minuteStr?: string,
  amPm?: string,
): { isValid: boolean; hours: number; minutes: number } {
  let hours = parseInt(hourStr, 10);
  const minutes = minuteStr ? parseInt(minuteStr, 10) : 0;

  if (isNaN(hours) || hours < 1 || hours > 12) {
    return { isValid: false, hours: 0, minutes: 0 };
  }

  if (amPm) {
    const isPm = amPm.toLowerCase() === 'pm';
    if (isPm && hours !== 12) {
      hours += 12;
    } else if (!isPm && hours === 12) {
      hours = 0;
    }
  } else {
    // 24-hour format assumed if no AM/PM
    if (hours > 23) {
      return { isValid: false, hours: 0, minutes: 0 };
    }
  }

  if (minutes < 0 || minutes > 59) {
    return { isValid: false, hours: 0, minutes: 0 };
  }

  return { isValid: true, hours, minutes };
}


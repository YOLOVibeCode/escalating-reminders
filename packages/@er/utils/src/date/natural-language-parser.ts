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
 * Parse "until [date]" patterns (e.g., "until December 25th", "until 2024-12-25").
 */
function parseUntilDate(
  normalized: string,
  referenceDate: Date,
): { isValid: boolean; date: Date; confidence: 'high' | 'medium' | 'low' } {
  const result: { isValid: boolean; date: Date; confidence: 'high' | 'medium' | 'low' } = {
    isValid: false,
    date: new Date(referenceDate),
    confidence: 'low',
  };

  // Must start with "until "
  if (!normalized.startsWith('until ')) {
    return result;
  }

  const datePart = normalized.substring(6).trim(); // Remove "until "

  // ISO format: "until 2024-12-25"
  const isoPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  const isoMatch = datePart.match(isoPattern);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1; // 0-indexed
    const day = parseInt(isoMatch[3], 10);
    if (year && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        result.date = date;
        result.isValid = true;
        result.confidence = 'high';
        return result;
      }
    }
  }

  // Month name format: "until December 25th", "until December 25"
  const monthNames: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  // Pattern: "december 25th" or "december 25"
  const monthDayPattern = /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?$/i;
  const monthDayMatch = datePart.match(monthDayPattern);
  if (monthDayMatch && monthDayMatch[1] && monthDayMatch[2]) {
    const monthName = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const monthIndex = monthNames[monthName];

    if (monthIndex !== undefined && day >= 1 && day <= 31) {
      const refYear = referenceDate.getFullYear();
      const refMonth = referenceDate.getMonth();
      const refDay = referenceDate.getDate();

      // Determine year: if month/day is in the past this year, use next year
      let targetYear = refYear;
      if (monthIndex < refMonth || (monthIndex === refMonth && day < refDay)) {
        targetYear = refYear + 1;
      }

      const date = new Date(targetYear, monthIndex, day);
      // Validate the date is valid (handles Feb 30, etc.)
      if (
        date.getFullYear() === targetYear &&
        date.getMonth() === monthIndex &&
        date.getDate() === day
      ) {
        result.date = date;
        result.isValid = true;
        result.confidence = 'high';
        return result;
      }
    }
  }

  return result;
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
 * - "until December 25th"
 * - "for 3 days"
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

  // "until [time] tomorrow" (e.g., "until 9am tomorrow")
  const untilTimeTomorrowPattern = /^until\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s+tomorrow$/i;
  const untilTimeTomorrowMatch = normalized.match(untilTimeTomorrowPattern);
  if (untilTimeTomorrowMatch) {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() + 1);
    const hour = untilTimeTomorrowMatch[1];
    if (hour) {
      const timeResult = parseTime(hour, untilTimeTomorrowMatch[2], untilTimeTomorrowMatch[3]);
      if (timeResult.isValid) {
        date.setHours(timeResult.hours, timeResult.minutes, 0, 0);
        result.date = date;
        result.isValid = true;
        result.confidence = 'high';
        return result;
      }
    }
  }

  // "until next [day of week]" (e.g., "until next Friday")
  const untilNextDayPattern = /^until\s+next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i;
  const untilNextDayMatch = normalized.match(untilNextDayPattern);
  if (untilNextDayMatch) {
    const dayName = untilNextDayMatch[1];
    if (dayName) {
      const dayIndex = getDayIndex(dayName);
      const date = getNextWeekday(referenceDate, dayIndex);
      result.date = date;
      result.isValid = true;
      result.confidence = 'high';
      return result;
    }
  }

  // "until [date]" (e.g., "until December 25th", "until 2024-12-25")
  const untilDateMatch = parseUntilDate(normalized, referenceDate);
  if (untilDateMatch.isValid) {
    result.date = untilDateMatch.date;
    result.isValid = true;
    result.confidence = untilDateMatch.confidence;
    return result;
  }

  // "for X days" (synonym for "in X days")
  const forPattern = /^for\s+(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)$/i;
  const forMatch = normalized.match(forPattern);
  if (forMatch) {
    const amountStr = forMatch[1];
    const unitStr = forMatch[2];
    if (amountStr && unitStr) {
      const amount = parseInt(amountStr, 10);
      const unit = unitStr.toLowerCase();
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
  }

  // "in X minutes/hours/days/weeks"
  const inPattern = /^in\s+(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months)$/i;
  const inMatch = normalized.match(inPattern);
  if (inMatch) {
    const amountStr = inMatch[1];
    const unitStr = inMatch[2];
    if (!amountStr || !unitStr) {
      return result;
    }
    const amount = parseInt(amountStr, 10);
    const unit = unitStr.toLowerCase();
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
    if (!dayName) return result;
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
    if (!dayName) return result;
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
    const hour = tomorrowAtMatch[1];
    if (!hour) return result;
    const timeResult = parseTime(hour, tomorrowAtMatch[2], tomorrowAtMatch[3]);
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
    const hour = dayAtMatch[2];
    if (!dayName || !hour) return result;
    const dayIndex = getDayIndex(dayName);
    const date = getNextWeekday(referenceDate, dayIndex);
    const timeResult = parseTime(hour, dayAtMatch[3], dayAtMatch[4]);
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


import { parseNaturalLanguageDateTime } from '../../src/date/natural-language-parser';

describe('NaturalLanguageParser', () => {
  const referenceDate = new Date('2024-01-15T10:00:00Z'); // Monday, Jan 15, 2024, 10:00 AM

  describe('parseNaturalLanguageDateTime', () => {
    describe('"in X minutes/hours/days/weeks"', () => {
      it('should parse "in 30 minutes"', () => {
        const result = parseNaturalLanguageDateTime('in 30 minutes', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getMinutes()).toBe(30);
      });

      it('should parse "in 2 hours"', () => {
        const result = parseNaturalLanguageDateTime('in 2 hours', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        // Reference is 10:00 UTC, adding 2 hours = 12:00 UTC
        expect(result.date.getUTCHours()).toBe(12);
      });

      it('should parse "in 3 days"', () => {
        const result = parseNaturalLanguageDateTime('in 3 days', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(18);
      });

      it('should parse "in 2 weeks"', () => {
        const result = parseNaturalLanguageDateTime('in 2 weeks', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(29);
      });
    });

    describe('"next [day of week]"', () => {
      it('should parse "next Friday"', () => {
        const result = parseNaturalLanguageDateTime('next Friday', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDay()).toBe(5); // Friday
      });

      it('should parse "next Monday"', () => {
        const result = parseNaturalLanguageDateTime('next Monday', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDay()).toBe(1); // Monday
      });
    });

    describe('"this [day of week]"', () => {
      it('should parse "this Friday"', () => {
        const result = parseNaturalLanguageDateTime('this Friday', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDay()).toBe(5); // Friday
      });
    });

    describe('"tomorrow"', () => {
      it('should parse "tomorrow"', () => {
        const result = parseNaturalLanguageDateTime('tomorrow', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(16);
      });

      it('should parse "tomorrow at 3pm"', () => {
        const result = parseNaturalLanguageDateTime('tomorrow at 3pm', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(16);
        expect(result.date.getHours()).toBe(15);
      });

      it('should parse "tomorrow at 9:30am"', () => {
        const result = parseNaturalLanguageDateTime('tomorrow at 9:30am', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(16);
        expect(result.date.getHours()).toBe(9);
        expect(result.date.getMinutes()).toBe(30);
      });
    });

    describe('"[day] at [time]"', () => {
      it('should parse "Friday at 5pm"', () => {
        const result = parseNaturalLanguageDateTime('Friday at 5pm', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDay()).toBe(5); // Friday
        expect(result.date.getHours()).toBe(17);
      });
    });

    describe('"next week"', () => {
      it('should parse "next week"', () => {
        const result = parseNaturalLanguageDateTime('next week', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('medium');
        expect(result.date.getDate()).toBe(22);
      });
    });

    describe('"for X days" (spec format)', () => {
      it('should parse "for 3 days"', () => {
        const result = parseNaturalLanguageDateTime('for 3 days', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(18); // Jan 15 + 3 days = Jan 18
      });

      it('should parse "for 1 day"', () => {
        const result = parseNaturalLanguageDateTime('for 1 day', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(16);
      });

      it('should parse "for 7 days"', () => {
        const result = parseNaturalLanguageDateTime('for 7 days', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(22);
      });
    });

    describe('"until [date]" (spec format)', () => {
      it('should parse "until December 25th"', () => {
        const result = parseNaturalLanguageDateTime('until December 25th', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getMonth()).toBe(11); // December (0-indexed)
        expect(result.date.getDate()).toBe(25);
        // Should be in 2024 (same year as reference)
        expect(result.date.getFullYear()).toBe(2024);
      });

      it('should parse "until December 25" (without "th")', () => {
        const result = parseNaturalLanguageDateTime('until December 25', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getMonth()).toBe(11);
        expect(result.date.getDate()).toBe(25);
      });

      it('should parse "until January 1st"', () => {
        const result = parseNaturalLanguageDateTime('until January 1st', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getMonth()).toBe(0); // January
        expect(result.date.getDate()).toBe(1);
        // Should be 2025 (next year since reference is Jan 15, 2024)
        expect(result.date.getFullYear()).toBe(2025);
      });

      it('should parse "until 2024-12-25" (ISO format)', () => {
        const result = parseNaturalLanguageDateTime('until 2024-12-25', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getFullYear()).toBe(2024);
        expect(result.date.getMonth()).toBe(11);
        expect(result.date.getDate()).toBe(25);
      });
    });

    describe('"until [time] tomorrow" (spec format)', () => {
      it('should parse "until 9am tomorrow"', () => {
        const result = parseNaturalLanguageDateTime('until 9am tomorrow', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(16); // Tomorrow
        expect(result.date.getHours()).toBe(9);
        expect(result.date.getMinutes()).toBe(0);
      });

      it('should parse "until 3pm tomorrow"', () => {
        const result = parseNaturalLanguageDateTime('until 3pm tomorrow', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDate()).toBe(16);
        expect(result.date.getHours()).toBe(15);
      });
    });

    describe('"until next Friday" (spec format - already supported)', () => {
      it('should parse "until next Friday"', () => {
        const result = parseNaturalLanguageDateTime('until next Friday', referenceDate);
        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe('high');
        expect(result.date.getDay()).toBe(5); // Friday
      });
    });

    describe('invalid inputs', () => {
      it('should return invalid for unrecognized text', () => {
        const result = parseNaturalLanguageDateTime('invalid text', referenceDate);
        expect(result.isValid).toBe(false);
        expect(result.confidence).toBe('low');
      });
    });
  });
});


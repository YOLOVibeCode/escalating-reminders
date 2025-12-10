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
        expect(result.date.getHours()).toBe(12);
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

    describe('invalid inputs', () => {
      it('should return invalid for unrecognized text', () => {
        const result = parseNaturalLanguageDateTime('invalid text', referenceDate);
        expect(result.isValid).toBe(false);
        expect(result.confidence).toBe('low');
      });
    });
  });
});


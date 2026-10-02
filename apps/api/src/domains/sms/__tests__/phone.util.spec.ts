import { parseToE164 } from '../phone.util';

describe('parseToE164', () => {
  it('normalizes US numbers to E.164', () => {
    expect(parseToE164('(512) 555-0100')).toBe('+15125550100');
  });

  it('throws on invalid input', () => {
    expect(() => parseToE164('not-a-phone')).toThrow('Invalid phone number');
  });
});

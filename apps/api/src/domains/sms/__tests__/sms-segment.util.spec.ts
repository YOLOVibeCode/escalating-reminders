import { assertSingleSmsSegment } from '../sms-segment.util';

describe('assertSingleSmsSegment', () => {
  it('allows GSM-7 body at 160 chars', () => {
    expect(() => {
      assertSingleSmsSegment('a'.repeat(160));
    }).not.toThrow();
  });

  it('rejects GSM-7 body over 160 chars', () => {
    expect(() => { assertSingleSmsSegment('a'.repeat(161)); }).toThrow(/single-segment/);
  });

  it('allows UCS-2 body at 70 code points', () => {
    expect(() => {
      assertSingleSmsSegment('😀'.repeat(70));
    }).not.toThrow();
  });

  it('rejects UCS-2 body over 70 code points', () => {
    expect(() => { assertSingleSmsSegment('😀'.repeat(71)); }).toThrow(/UCS-2/);
  });
});

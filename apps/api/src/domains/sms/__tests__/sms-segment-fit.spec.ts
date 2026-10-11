import { SMS_STOP_FOOTER } from '../sms-compliance.constants';
import { assertSingleSmsSegment, fitSingleSegment } from '../sms-segment.util';

const prefix = 'Escalating Reminders: ';

describe('fitSingleSegment', () => {
  it('adds the STOP footer to a short text', () => {
    expect(fitSingleSegment('Pay rent', { prefix, footer: SMS_STOP_FOOTER })).toBe(
      'Pay rent. Reply STOP to opt out.',
    );
  });

  it('does not add the footer twice', () => {
    const body = 'Pay rent. Reply STOP to opt out.';
    expect(fitSingleSegment(body, { prefix, footer: SMS_STOP_FOOTER })).toBe(body);
  });

  it('cuts long content so prefix + content + footer is one GSM-7 segment', () => {
    const body = fitSingleSegment(`Pay rent\n${'x'.repeat(300)}`, { prefix, footer: SMS_STOP_FOOTER });
    expect(body.endsWith('... Reply STOP to opt out.')).toBe(true);
    expect(`${prefix}${body}`.length).toBe(160);
    expect(() => {
      assertSingleSmsSegment(`${prefix}${body}`);
    }).not.toThrow();
  });

  it('respects the 70-character limit when the content needs UCS-2', () => {
    const body = fitSingleSegment(`Call mom 📞 ${'y'.repeat(100)}`, { prefix, footer: SMS_STOP_FOOTER });
    expect(body.endsWith(SMS_STOP_FOOTER)).toBe(true);
    expect(() => {
      assertSingleSmsSegment(`${prefix}${body}`);
    }).not.toThrow();
  });
});

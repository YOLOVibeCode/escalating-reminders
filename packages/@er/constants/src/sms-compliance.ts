/** SMS compliance copy and relay endpoints for Escalating Reminders. */

export const SMS_BRAND = 'Escalating Reminders';

export const SMS_PURPOSE = 'reminders you set and their escalations';

export const SMS_HELP_ONE_LINER =
  'reminders that escalate until you acknowledge them.';

export const SMS_CONSENT_TEXT_VERSION = '2026-10-01';

export const SMS_SUPPORT_EMAIL = 'support@escalatingreminders.com';

export const SMS_RELAY_SEND_URL = 'https://api.twilio.noctusoft.com/sms/send';

export const SMS_DEFAULT_INBOUND_WEBHOOK_URL =
  'https://api.escalatingreminders.com/webhooks/sms';

export const SMS_DEFAULT_STATUS_WEBHOOK_URL =
  'https://api.escalatingreminders.com/webhooks/sms-status';

export const SMS_STOP_KEYWORDS = [
  'STOP',
  'STOPALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
  'REVOKE',
  'OPTOUT',
] as const;

export const SMS_START_KEYWORDS = ['START', 'UNSTOP'] as const;

export const SMS_HELP_KEYWORDS = ['HELP', 'INFO'] as const;

export const SMS_YES_KEYWORD = 'YES';

export function buildSmsSelfOptInLabel(): string {
  return (
    `Text me ${SMS_PURPOSE} from ${SMS_BRAND}. Message frequency varies. ` +
    `Message and data rates may apply. Reply STOP to opt out, HELP for help. ` +
    `Consent is not a condition of purchase. See our SMS Terms and Privacy Policy.`
  );
}

export function buildSmsHelpReplyBody(): string {
  return (
    `${SMS_BRAND}: ${SMS_HELP_ONE_LINER} Help: ${SMS_SUPPORT_EMAIL}. ` +
    `Msg frequency varies. Msg & data rates may apply. Reply STOP to opt out.`
  );
}

export function buildTrustedContactConfirmationBody(who: string): string {
  return (
    `${SMS_BRAND}: ${who} added this number for ${SMS_PURPOSE}. ` +
    `Reply YES to receive these texts. Reply STOP to opt out.`
  );
}

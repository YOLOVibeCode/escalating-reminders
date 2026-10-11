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

/**
 * Legacy request text, no longer sent: adding a trusted contact used to text the number and ask
 * for YES. Kept so a YES reply to a request sent before 2026-10-11 still maps to the right contact.
 */
export function buildTrustedContactConfirmationBody(who: string): string {
  return (
    `${SMS_BRAND}: ${who} added this number for ${SMS_PURPOSE}. ` +
    `Reply YES to receive these texts. Reply STOP to opt out.`
  );
}

/** Metadata `type` of the legacy request text in sms_message_logs. */
export const SMS_LEGACY_TRUSTED_CONTACT_REQUEST_TYPE = 'trusted-contact-confirmation';

/** Wording version of the trusted-contact opt-in page. Bump when the label changes. */
export const SMS_TRUSTED_CONTACT_CONSENT_TEXT_VERSION = '2026-10-11';

/** Footer every reminder and escalation text ends with. */
export const SMS_STOP_FOOTER = 'Reply STOP to opt out.';

/**
 * Consent purpose for one trusted contact. A contact agrees to alerts about one person's
 * reminders, so consent is recorded per contact, never shared with other users who add the number.
 */
export function trustedContactSmsPurpose(trustedContactId: string): string {
  return `trusted-contact:${trustedContactId}`;
}

/** Name of the person who invited a contact, safe for a GSM-7 text: ASCII only, length-capped. */
export function smsSafeName(name: string, maxLength = 24): string {
  const ascii = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const capped = ascii.length > maxLength ? ascii.slice(0, maxLength).trim() : ascii;
  return capped === '' ? 'Someone' : capped;
}

/** The unchecked box on the trusted-contact opt-in page (/contact-optin/<token>). */
export function buildTrustedContactOptInLabel(inviter: string): string {
  return (
    `Text me escalation alerts from ${SMS_BRAND} when a reminder ${inviter} set is still ` +
    `unacknowledged. Message frequency varies. Message and data rates may apply. ` +
    `Reply STOP to opt out, HELP for help. Consent is not a condition of purchase. ` +
    `See our SMS Terms and Privacy Policy.`
  );
}

/** The one text sent right after a contact opts in on the page (brand prefix added by the sender). */
export function buildTrustedContactOptInConfirmationBody(inviter: string): string {
  return (
    `you'll get alerts when ${smsSafeName(inviter, 18)}'s reminders escalate. ` +
    `Msg freq varies. Msg&data rates may apply. HELP for help, STOP to opt out.`
  );
}

/** Escalation text to a trusted contact who opted in (brand prefix and STOP footer added later). */
export function buildTrustedContactAlertContent(
  inviter: string,
  tier: number,
  title: string,
  message: string,
): string {
  const detail = message !== '' && message !== title ? ` ${message}` : '';
  return `${smsSafeName(inviter)}'s reminder is still open (tier ${tier}): ${title}.${detail}`;
}

import { parsePhoneNumberFromString } from 'libphonenumber-js';

const DEFAULT_REGION = 'US';

/** Normalize user input to E.164 or throw. */
export function parseToE164(phone: string, defaultRegion: string = DEFAULT_REGION): string {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new Error('Phone number is required');
  }
  const parsed = parsePhoneNumberFromString(trimmed, defaultRegion as 'US');
  if (!parsed?.isValid()) {
    throw new Error('Invalid phone number');
  }
  return parsed.format('E.164');
}

import Link from 'next/link';

import { PublicFooter } from '@/components/public-footer';

import {
  SMS_BRAND,
  SMS_PURPOSE,
  SMS_SUPPORT_EMAIL,
  buildSmsSelfOptInLabel,
} from '../../../../../packages/@er/constants/src/sms-compliance';

const SMS_PRIVACY_VERBATIM =
  'We do not share, sell, or provide your mobile phone number or SMS opt-in data to third parties or affiliates for marketing or promotional purposes.';

/**
 * Public description of the SMS program, for people deciding whether to opt in and for
 * carrier review. Shows the exact opt-in wording the profile page uses, so it never drifts.
 */
export default function SmsPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="mx-auto max-w-3xl flex-1 space-y-6 px-6 py-12 text-gray-800">
        <h1 className="text-3xl font-bold text-gray-900">Text messages from {SMS_BRAND}</h1>

        <p>
          {SMS_BRAND} sends you the reminders you set, and raises their urgency until you
          acknowledge them. You can choose to get those reminders by text. These are messages about
          reminders you created, not marketing.
        </p>

        <ul className="list-disc space-y-1 pl-6" data-testid="sms-program-facts">
          <li>Every message starts with &ldquo;{SMS_BRAND}:&rdquo;.</li>
          <li>Message frequency varies with the reminders you set.</li>
          <li>Message and data rates may apply.</li>
          <li>Reply STOP to opt out at any time, or HELP for help.</li>
          <li>Support: {SMS_SUPPORT_EMAIL}</li>
          <li>{SMS_PRIVACY_VERBATIM}</li>
        </ul>

        <section className="space-y-3" aria-labelledby="sms-opt-in-heading">
          <h2 id="sms-opt-in-heading" className="text-xl font-semibold text-gray-900">
            How to opt in
          </h2>
          <p>
            Texts are optional. Reminders also arrive by email, and you can use {SMS_BRAND} without
            ever giving a phone number. To get texts, add your mobile number in your profile and
            check this box. It is never checked for you:
          </p>
          <figure
            className="rounded border border-gray-300 bg-white p-4"
            data-testid="sms-opt-in-wording"
          >
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" disabled className="mt-1" aria-label="Example opt-in box" />
              <span>{buildSmsSelfOptInLabel()}</span>
            </label>
            <figcaption className="mt-2 text-xs text-gray-500">
              The opt-in box on the profile page ({SMS_PURPOSE}).
            </figcaption>
          </figure>
          <p>
            We record when you checked the box and the wording you saw. Reply STOP to any message, or
            uncheck the box in your profile, to stop texts.
          </p>
        </section>

        <p>
          Read the{' '}
          <Link href="/terms#sms" className="text-blue-600 underline">
            SMS Terms
          </Link>{' '}
          and the{' '}
          <Link href="/privacy" className="text-blue-600 underline">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

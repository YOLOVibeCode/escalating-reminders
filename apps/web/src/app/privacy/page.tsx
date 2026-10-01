import Link from 'next/link';
import { PublicFooter } from '@/components/public-footer';
import { SMS_SUPPORT_EMAIL } from '../../../../../packages/@er/constants/src/sms-compliance';

const SMS_PRIVACY_VERBATIM =
  'We do not share, sell, or provide your mobile phone number or SMS opt-in data to third parties or affiliates for marketing or promotional purposes.';

export default function PrivacyPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-4 text-gray-600">Escalating Reminders</p>

        <section className="mt-8 space-y-4 text-gray-800">
          <h2 className="text-xl font-semibold">Text messages</h2>
          <p>
            We send SMS about reminders you set and their escalations. Message frequency varies.
            Message and data rates may apply. Reply STOP to opt out or HELP for help at{' '}
            {SMS_SUPPORT_EMAIL}.
          </p>
          <p data-testid="privacy-sms-verbatim">{SMS_PRIVACY_VERBATIM}</p>
        </section>

        <p className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">Back to home</Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

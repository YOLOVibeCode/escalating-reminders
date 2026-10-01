import Link from 'next/link';
import { PublicFooter } from '@/components/public-footer';
import {
  SMS_BRAND,
  SMS_PURPOSE,
  SMS_SUPPORT_EMAIL,
} from '../../../../../packages/@er/constants/src/sms-compliance';

export default function TermsPage(): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="mx-auto max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="mt-4 text-gray-600">Escalating Reminders</p>

        <section id="sms" className="mt-8 space-y-4 text-gray-800" data-testid="terms-sms-section">
          <h2 className="text-xl font-semibold">SMS Terms</h2>
          <p>
            <strong>Program:</strong> {SMS_BRAND} SMS notifications for {SMS_PURPOSE}.
          </p>
          <p>
            <strong>How to opt in:</strong> Provide your mobile number and check the optional SMS
            opt-in box on your profile or reply YES to a confirmation text when someone adds your
            number as a trusted contact.
          </p>
          <p>Message frequency varies.</p>
          <p>Message and data rates may apply.</p>
          <p>Reply STOP to opt out; reply HELP for help.</p>
          <p>Support: {SMS_SUPPORT_EMAIL}</p>
          <p>Carriers are not liable for delayed or undelivered messages.</p>
        </section>

        <p className="mt-8">
          <Link href="/" className="text-blue-600 hover:underline">Back to home</Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

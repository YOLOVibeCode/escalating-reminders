'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

import {
  SMS_BRAND,
  SMS_SUPPORT_EMAIL,
} from '../../../../packages/@er/constants/src/sms-compliance';

interface IOptInView {
  inviterName: string;
  contactName: string;
  phoneLastFour: string | null;
  optedIn: boolean;
  consentLabel: string;
  consentTextVersion: string;
}

const NOT_CONSENT = 'Check the box to get texts. A number alone is not consent.';

/**
 * A trusted contact opts in to escalation texts themselves. Nothing is texted to them before
 * they check the box here; the box is never checked for them.
 */
export function ContactOptIn({ token }: { token: string }): JSX.Element {
  const [view, setView] = useState<IOptInView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<IOptInView>(`/public/trusted-contact-optin/${encodeURIComponent(token)}`)
      .then((data) => {
        if (!cancelled) setView(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'This link is not valid any more.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    if (!agreed) {
      setFormError(NOT_CONSENT);
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/public/trusted-contact-optin/${encodeURIComponent(token)}`, {
        phone,
        consent: true,
      });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not opt in. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError !== null) {
    return (
      <div className="space-y-4" data-testid="contact-optin-invalid">
        <h1 className="text-2xl font-bold text-gray-900">This link is not valid</h1>
        <p>{loadError}</p>
      </div>
    );
  }

  if (view === null) {
    return <p data-testid="contact-optin-loading">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {view.inviterName} asked you to be a trusted contact
      </h1>

      <p>
        {view.inviterName} uses {SMS_BRAND}, which raises the urgency of reminders they set until
        they acknowledge them. If one of their reminders is still unacknowledged at a later stage,
        we can text you so you can check on them. You do not have to opt in. If you don&rsquo;t, we
        will never text you.
      </p>

      <ul className="list-disc space-y-1 pl-6" data-testid="contact-optin-facts">
        <li>Every message starts with &ldquo;{SMS_BRAND}:&rdquo;.</li>
        <li>Message frequency varies with {view.inviterName}&rsquo;s reminders.</li>
        <li>Message and data rates may apply.</li>
        <li>Reply STOP to opt out at any time, or HELP for help.</li>
        <li>Support: {SMS_SUPPORT_EMAIL}</li>
        <li>
          We do not share, sell, or provide your mobile phone number or SMS opt-in data to third
          parties or affiliates for marketing or promotional purposes.
        </li>
      </ul>

      {done || view.optedIn ? (
        <p className="rounded border border-green-300 bg-green-50 p-4" data-testid="contact-optin-done">
          {done
            ? 'You are opted in. We sent you one text to confirm. Reply STOP at any time to stop.'
            : 'You are already opted in. Reply STOP to any message to stop.'}
        </p>
      ) : (
        <form
          className="space-y-4 rounded border border-gray-300 bg-white p-4"
          data-testid="form-contact-optin"
          onSubmit={(e) => {
            void submit(e);
          }}
        >
          {formError !== null && (
            <p className="text-sm text-red-600" role="alert" data-testid="error-contact-optin">
              {formError}
            </p>
          )}
          <div>
            <label htmlFor="contact-optin-phone" className="block text-sm font-medium text-gray-700">
              Your mobile number (US or Canada)
              {view.phoneLastFour !== null ? `, ending in ${view.phoneLastFour}` : ''}
            </label>
            <input
              id="contact-optin-phone"
              type="tel"
              required
              autoComplete="tel"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              data-testid="input-contact-optin-phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
              }}
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-700" htmlFor="contact-optin-consent">
            <input
              id="contact-optin-consent"
              type="checkbox"
              className="mt-1"
              data-testid="checkbox-contact-optin-consent"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
              }}
            />
            <span data-testid="contact-optin-consent-label">{view.consentLabel}</span>
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            data-testid="btn-contact-optin"
          >
            Opt in to texts
          </button>
        </form>
      )}

      <p className="text-sm">
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
    </div>
  );
}

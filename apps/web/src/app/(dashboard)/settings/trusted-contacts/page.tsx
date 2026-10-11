'use client';

import { Card, CardContent, CardHeader, CardTitle , Button, Input } from '@er/ui-components';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';


type SmsStatus = 'EMAIL_ONLY' | 'INVITED' | 'OPTED_IN' | 'OPTED_OUT';

interface ITrustedContactRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  relationship: string;
  notificationPreferences: { email: boolean; sms: boolean };
  smsOptInToken?: string | null;
  smsStatus?: SmsStatus;
}

const STATUS_LABEL: Record<SmsStatus, string> = {
  EMAIL_ONLY: 'Email only',
  INVITED: 'Invited to texts: waiting for them to opt in',
  OPTED_IN: 'Opted in to texts',
  OPTED_OUT: 'Opted out of texts (replied STOP)',
};

function optInLink(token: string): string {
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return `${origin}/contact-optin/${token}`;
}

export default function TrustedContactsPage(): JSX.Element {
  const [contacts, setContacts] = useState<ITrustedContactRow[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [notifyViaSms, setNotifyViaSms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<ITrustedContactRow[]>('/trusted-contacts');
      setContacts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/trusted-contacts', {
        name,
        phone: phone.trim() || undefined,
        relationship,
        notifyViaSms,
      });
      setName('');
      setPhone('');
      setNotifyViaSms(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <Link href="/settings" className="text-sm text-blue-600 hover:text-blue-800">
        Back to Settings
      </Link>
      <h1 className="text-3xl font-bold text-gray-900">Trusted Contacts</h1>

      <form
        data-testid="form-trusted-contact"
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Add contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error !== null && (
              <p className="text-sm text-red-600" data-testid="error-trusted-contact" role="alert">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="contact-name"
                data-testid="input-contact-name"
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                required
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-medium text-gray-700">
                Phone (optional)
              </label>
              <Input
                id="contact-phone"
                type="tel"
                data-testid="input-contact-phone"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); }}
                placeholder="+1 555 123 4567"
              />
            </div>
            <label className="flex items-start gap-2 text-sm" htmlFor="notify-via-sms">
              <input
                id="notify-via-sms"
                type="checkbox"
                className="mt-1"
                data-testid="checkbox-contact-notify-sms"
                checked={notifyViaSms}
                onChange={(e) => { setNotifyViaSms(e.target.checked); }}
              />
              <span>
                Invite this contact to get escalation texts. You&rsquo;ll get a link to send them, and
                they opt in themselves. We never text them first.
              </span>
            </label>
            <div>
              <label htmlFor="contact-relationship" className="block text-sm font-medium text-gray-700">
                Relationship
              </label>
              <Input
                id="contact-relationship"
                data-testid="input-contact-relationship"
                value={relationship}
                onChange={(e) => { setRelationship(e.target.value); }}
                required
              />
            </div>
            <Button type="submit" data-testid="btn-add-trusted-contact">Add contact</Button>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Your contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p data-testid="loading-trusted-contacts">Loading...</p>
          ) : contacts.length === 0 ? (
            <p data-testid="empty-trusted-contacts">No trusted contacts yet.</p>
          ) : (
            <ul data-testid="list-trusted-contacts" className="space-y-2">
              {contacts.map((c) => {
                const status: SmsStatus = c.smsStatus ?? 'EMAIL_ONLY';
                const token = c.smsOptInToken ?? null;
                return (
                  <li key={c.id} data-testid={`row-contact-${c.id}`} className="space-y-1">
                    <div>
                      {c.name} — {c.phone ?? 'no phone'}
                    </div>
                    <div className="text-sm text-gray-600" data-testid={`status-contact-${c.id}`}>
                      {STATUS_LABEL[status]}
                    </div>
                    {status === 'INVITED' && token !== null && (
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span>Send them this link:</span>
                        <code
                          className="break-all rounded bg-gray-100 px-1"
                          data-testid={`optin-link-${c.id}`}
                        >
                          {optInLink(token)}
                        </code>
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-800"
                          data-testid={`btn-copy-optin-${c.id}`}
                          onClick={() => {
                            void navigator.clipboard.writeText(optInLink(token)).then(() => {
                              setCopiedId(c.id);
                            });
                          }}
                        >
                          {copiedId === c.id ? 'Copied' : 'Copy link'}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

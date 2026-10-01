'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@er/ui-components';
import { Button, Input } from '@er/ui-components';

type TrustedContact = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  relationship: string;
  notificationPreferences: { email: boolean; sms: boolean };
};

export default function TrustedContactsPage(): JSX.Element {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('friend');
  const [notifyViaSms, setNotifyViaSms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<TrustedContact[]>('/trusted-contacts');
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
        notifyViaSms: notifyViaSms && Boolean(phone.trim()),
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

      <form data-testid="form-trusted-contact" onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Add contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
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
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </div>
            {phone.trim() && (
              <label className="flex items-center gap-2 text-sm" htmlFor="notify-via-sms">
                <input
                  id="notify-via-sms"
                  type="checkbox"
                  data-testid="checkbox-contact-notify-sms"
                  checked={notifyViaSms}
                  onChange={(e) => setNotifyViaSms(e.target.checked)}
                />
                Request SMS notifications for this contact (they must reply YES to opt in)
              </label>
            )}
            <div>
              <label htmlFor="contact-relationship" className="block text-sm font-medium text-gray-700">
                Relationship
              </label>
              <Input
                id="contact-relationship"
                data-testid="input-contact-relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
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
              {contacts.map((c) => (
                <li key={c.id} data-testid={`row-contact-${c.id}`}>
                  {c.name} — {c.phone || 'no phone'}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

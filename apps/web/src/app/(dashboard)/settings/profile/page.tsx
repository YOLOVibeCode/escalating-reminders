/**
 * Profile editing page.
 * Edit user profile information.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMe, useUpdateProfile } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@er/ui-components';
import { Button, Input } from '@er/ui-components';
import { useQueryClient } from '@tanstack/react-query';
import { SmsOptInCheckbox } from '@/components/sms-opt-in-checkbox';

export default function ProfileEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meQuery = useMe() as unknown as { data?: any; isLoading: boolean };
  const user = meQuery.data;
  const isLoading = meQuery.isLoading;
  const updateProfileMutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [phone, setPhone] = useState('');
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile) {
      setDisplayName(user.profile.displayName || '');
      setTimezone(user.profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload: {
        displayName?: string;
        timezone?: string;
        phone?: string | null;
        smsOptIn?: boolean;
        smsConsentSource?: string;
      } = {};
      const display = displayName.trim();
      const tz = timezone.trim();
      const phoneTrimmed = phone.trim();
      if (display) payload.displayName = display;
      if (tz) payload.timezone = tz;
      if (phoneTrimmed) payload.phone = phoneTrimmed;
      else payload.phone = null;
      if (smsOptIn) {
        payload.smsOptIn = true;
        payload.smsConsentSource = '/settings/profile';
      }

      await updateProfileMutation.mutateAsync(payload);
      
      // Invalidate and refetch user data
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      
      router.push('/settings');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to update profile. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link href="/settings" className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Settings
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-gray-600">Update your account information</p>
      </div>

      <form onSubmit={handleSubmit} data-testid="profile-form">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your display name and timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4" data-testid="profile-error" role="alert">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="mt-1 bg-gray-50"
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                data-testid="display-name-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Mobile phone (optional)
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                data-testid="input-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
                placeholder="+1 555 123 4567"
                autoComplete="tel"
              />
            </div>

            {phone.trim() && (
              <SmsOptInCheckbox checked={smsOptIn} onChange={setSmsOptIn} />
            )}

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <Input
                id="timezone"
                name="timezone"
                type="text"
                data-testid="timezone-input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1"
                placeholder="America/New_York"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use IANA timezone identifier (e.g., America/New_York, Europe/London)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={updateProfileMutation.isPending}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="save-button">
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}


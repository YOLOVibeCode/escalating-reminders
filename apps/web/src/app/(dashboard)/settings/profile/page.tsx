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

export default function ProfileEditPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useMe();
  const updateProfileMutation = useUpdateProfile();
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile) {
      setDisplayName(user.profile.displayName || '');
      setTimezone(user.profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await updateProfileMutation.mutateAsync({
        displayName: displayName.trim() || undefined,
        timezone: timezone.trim() || undefined,
      });
      
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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your display name and timezone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
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
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1"
                placeholder="Your display name"
              />
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <Input
                id="timezone"
                type="text"
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
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateProfileMutation.isPending}>
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}


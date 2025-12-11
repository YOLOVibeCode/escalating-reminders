/**
 * Settings page.
 * User profile and account settings.
 */

'use client';

import { useMe } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@er/ui-components';

export default function SettingsPage() {
  const { data: user, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
          </div>
          {user?.profile?.displayName && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Display Name</label>
              <p className="mt-1 text-sm text-gray-900">{user.profile.displayName}</p>
            </div>
          )}
          {user?.profile?.timezone && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Timezone</label>
              <p className="mt-1 text-sm text-gray-900">{user.profile.timezone}</p>
            </div>
          )}
          <div className="pt-2">
            <Link href="/settings/profile">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Your current plan and limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Plan</label>
            <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
              {user?.subscription?.tier || 'Free'}
            </p>
          </div>
          {user?.subscription && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm capitalize text-gray-900">
                {user.subscription.status}
              </p>
            </div>
          )}
          <div className="pt-2">
            <Button variant="outline" size="sm" disabled>
              Manage Subscription (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Escalation Profiles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Profiles</CardTitle>
          <CardDescription>Manage your custom escalation profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-gray-600">
            Create and manage custom escalation profiles for your reminders.
          </p>
          <Link href="/settings/escalation-profiles">
            <Button variant="outline">Manage Profiles</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Dangerous actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="destructive" size="sm" disabled>
              Delete Account (Coming Soon)
            </Button>
            <p className="text-xs text-gray-500">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


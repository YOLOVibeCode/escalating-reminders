/**
 * Dashboard layout.
 * Provides navigation and structure for all dashboard pages.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout, useMe, useReminders } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@er/ui-components';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Reminders', href: '/reminders' },
  { name: 'Agents', href: '/agents' },
  { name: 'Notifications', href: '/notifications' },
  { name: 'Settings', href: '/settings' },
];

const ONBOARDING_DONE_KEY = 'er_onboarding_completed_v1';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const meQuery = useMe() as unknown as { data?: any };
  const user = meQuery.data;
  const logoutMutation = useLogout();
  const remindersQuery = useReminders({ page: 1, pageSize: 1 });
  const [onboardingDone, setOnboardingDone] = useState<boolean>(true);

  const shouldAutoRedirectToOnboarding = useMemo(() => {
    if (onboardingDone) return false;
    // Avoid redirect loops on onboarding and reminder creation screens.
    if (pathname === '/onboarding') return false;
    if (pathname === '/reminders/new') return false;
    // If reminders haven't loaded yet, don't redirect.
    if (!remindersQuery.data) return false;
    return (remindersQuery.data.pagination?.totalItems || 0) === 0;
  }, [onboardingDone, pathname, remindersQuery.data]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ONBOARDING_DONE_KEY);
      setOnboardingDone(stored === 'true');
    } catch {
      setOnboardingDone(true);
    }
  }, []);

  useEffect(() => {
    if (shouldAutoRedirectToOnboarding) {
      router.replace('/onboarding');
    }
  }, [router, shouldAutoRedirectToOnboarding]);

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      await logoutMutation.mutateAsync(refreshToken);
    }
    useAuthStore.getState().clearTokens();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white" data-testid="header">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Escalating Reminders
              </Link>
              <div className="ml-10 flex space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      data-testid={`nav-${item.name.toLowerCase()}-link`}
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user?.profile?.displayName && (
                <span className="text-sm text-gray-600">{user.profile.displayName}</span>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="logout-button">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}


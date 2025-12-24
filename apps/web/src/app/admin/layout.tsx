/**
 * Admin Dashboard Layout
 * Provides navigation and structure for admin pages.
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLogout, useMe } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@er/ui-components';
import { useEffect } from 'react';

const adminNavigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Users', href: '/admin/users', icon: '👥' },
  { name: 'Billing', href: '/admin/billing', icon: '💰' },
  { name: 'System', href: '/admin/system', icon: '🏥' },
  { name: 'Reminders', href: '/admin/reminders', icon: '⏰' },
  { name: 'Agents', href: '/admin/agents', icon: '🤖' },
  { name: 'Audit', href: '/admin/audit', icon: '📋' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useMe();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (refreshToken) {
      await logoutMutation.mutateAsync(refreshToken);
    }
    useAuthStore.getState().clearTokens();
    router.push('/login');
  };

  // Check if user is admin (basic check, will be enhanced with actual role check)
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white" data-testid="sidebar">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b p-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🔐</span>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin</h1>
                <p className="text-xs text-gray-500">Super Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {adminNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="border-t p-4">
            <div className="mb-3 rounded-md bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">Logged in as</p>
              <p className="text-sm font-semibold text-gray-900">
                {user.email}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                User Dashboard
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {/* Top Bar */}
        <header className="border-b bg-white px-8 py-4" data-testid="header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {adminNavigation.find((item) => pathname?.startsWith(item.href))?.name || 'Admin'}
              </h2>
              <p className="text-sm text-gray-500">
                Manage and monitor the Escalating Reminders platform
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                System Online
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="logout-button"
                disabled={logoutMutation.isPending}
              >
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}


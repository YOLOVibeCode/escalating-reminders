/**
 * Dashboard page.
 * Overview of reminders, stats, and quick actions.
 */

'use client';

import { useReminders, useMe } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@er/ui-components';
import type { Reminder } from '@er/types';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@er/ui-components';

/**
 * Recent reminders table columns.
 */
const columns: ColumnDef<Reminder>[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <Link
        href={`/reminders/${row.original.id}`}
        className="font-medium text-blue-600 hover:text-blue-800"
      >
        {row.original.title}
      </Link>
    ),
  },
  {
    accessorKey: 'importance',
    header: 'Importance',
    cell: ({ row }) => {
      const importance = row.original.importance;
      const colors = {
        LOW: 'text-gray-600',
        MEDIUM: 'text-yellow-600',
        HIGH: 'text-orange-600',
        CRITICAL: 'text-red-600',
      };
      return <span className={colors[importance] || ''}>{importance}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const colors = {
        ACTIVE: 'text-green-600',
        SNOOZED: 'text-yellow-600',
        COMPLETED: 'text-gray-600',
        ARCHIVED: 'text-gray-400',
      };
      return <span className={colors[status] || ''}>{status}</span>;
    },
  },
  {
    accessorKey: 'nextTriggerAt',
    header: 'Next Trigger',
    cell: ({ row }) => {
      const date = row.original.nextTriggerAt;
      return date ? new Date(date).toLocaleString() : 'N/A';
    },
  },
];

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useMe();
  const { data: remindersData, isLoading: remindersLoading } = useReminders({
    page: 1,
    pageSize: 5,
  });

  const recentReminders = remindersData?.items || [];
  const totalReminders = remindersData?.pagination.totalItems || 0;
  const activeReminders = recentReminders.filter((r) => r.status === 'ACTIVE').length;

  if (userLoading || remindersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back{user?.profile?.displayName ? `, ${user.profile.displayName}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">Here's what's happening with your reminders</p>
        </div>
        <Link href="/reminders/new">
          <Button>Create Reminder</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReminders}</div>
            <p className="text-xs text-muted-foreground">All time reminders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReminders}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {user?.subscription?.tier || 'Free'}
            </div>
            <p className="text-xs text-muted-foreground">Current plan</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reminders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Reminders</CardTitle>
              <CardDescription>Your most recent reminders</CardDescription>
            </div>
            <Link href="/reminders">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentReminders.length > 0 ? (
            <DataTable
              columns={columns}
              data={recentReminders}
              searchable={false}
              pagination={false}
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No reminders yet. Create your first reminder to get started!</p>
              <Link href="/reminders/new" className="mt-4 inline-block">
                <Button>Create Reminder</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


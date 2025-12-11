/**
 * Notification history page.
 * View history of all sent notifications.
 */

'use client';

import { useNotifications } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@er/ui-components';
import { DataTable } from '@er/ui-components';
import type { NotificationLog } from '@er/types';
import type { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { useState } from 'react';

/**
 * Notification history table columns.
 */
const columns: ColumnDef<NotificationLog>[] = [
  {
    accessorKey: 'reminderId',
    header: 'Reminder',
    cell: ({ row }) => (
      <Link
        href={`/reminders/${row.original.reminderId}`}
        className="font-medium text-blue-600 hover:text-blue-800"
      >
        View Reminder
      </Link>
    ),
  },
  {
    accessorKey: 'agentType',
    header: 'Agent',
    cell: ({ row }) => (
      <span className="text-sm font-medium text-gray-700">{row.original.agentType}</span>
    ),
  },
  {
    accessorKey: 'tier',
    header: 'Tier',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">Tier {row.original.tier}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const colors = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        SENT: 'bg-blue-100 text-blue-800',
        DELIVERED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            colors[status] || ''
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: 'sentAt',
    header: 'Sent At',
    cell: ({ row }) => {
      const date = row.original.sentAt;
      return date ? new Date(date).toLocaleString() : 'N/A';
    },
  },
  {
    accessorKey: 'deliveredAt',
    header: 'Delivered At',
    cell: ({ row }) => {
      const date = row.original.deliveredAt;
      return date ? new Date(date).toLocaleString() : 'N/A';
    },
  },
];

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data: notificationsData, isLoading } = useNotifications({
    page,
    pageSize: 20,
  });

  const notifications = notificationsData?.items || [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification History</h1>
        <p className="mt-1 text-sm text-gray-600">
          View history of all sent notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification History</CardTitle>
          <CardDescription>
            View all sent notifications and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <DataTable
              columns={columns}
              data={notifications}
              searchable={true}
              searchPlaceholder="Search notifications..."
              pagination={true}
            />
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No notifications yet.</p>
              <p className="mt-2 text-sm">Notifications will appear here once reminders are triggered.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


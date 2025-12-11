/**
 * Reminders list page.
 * Displays all reminders in a sortable, filterable table.
 */

'use client';

import { useState } from 'react';
import { useReminders } from '@/lib/api-client';
import { DataTable } from '@er/ui-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@er/ui-components';
import Link from 'next/link';
import type { Reminder, ReminderStatus, ReminderImportance } from '@er/types';
import type { ColumnDef } from '@tanstack/react-table';

/**
 * Reminders table columns.
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
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.original.description || 'No description'}
      </span>
    ),
  },
  {
    accessorKey: 'importance',
    header: 'Importance',
    cell: ({ row }) => {
      const importance = row.original.importance;
      const colors = {
        LOW: 'bg-gray-100 text-gray-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-orange-100 text-orange-800',
        CRITICAL: 'bg-red-100 text-red-800',
      };
      return (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            colors[importance] || ''
          }`}
        >
          {importance}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const colors = {
        ACTIVE: 'bg-green-100 text-green-800',
        SNOOZED: 'bg-yellow-100 text-yellow-800',
        COMPLETED: 'bg-gray-100 text-gray-800',
        ARCHIVED: 'bg-gray-100 text-gray-400',
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
    accessorKey: 'nextTriggerAt',
    header: 'Next Trigger',
    cell: ({ row }) => {
      const date = row.original.nextTriggerAt;
      if (!date) return <span className="text-gray-400">N/A</span>;
      return (
        <span className="text-sm">
          {new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString()}
        </span>
      );
    },
  },
];

export default function RemindersPage() {
  const [statusFilter, setStatusFilter] = useState<ReminderStatus | undefined>(undefined);
  const [importanceFilter, setImportanceFilter] = useState<ReminderImportance | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useReminders({
    status: statusFilter,
    importance: importanceFilter,
    page,
    pageSize: 20,
  });

  const reminders = data?.items || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading reminders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-red-600">Error loading reminders. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage all your reminders ({pagination?.totalItems || 0} total)
          </p>
        </div>
        <Link href="/reminders/new">
          <Button>Create Reminder</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter reminders by status or importance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusFilter || ''}
                onChange={(e) =>
                  setStatusFilter(e.target.value ? (e.target.value as ReminderStatus) : undefined)
                }
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="SNOOZED">Snoozed</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Importance</label>
              <select
                value={importanceFilter || ''}
                onChange={(e) =>
                  setImportanceFilter(
                    e.target.value ? (e.target.value as ReminderImportance) : undefined,
                  )
                }
                className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            {(statusFilter || importanceFilter) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter(undefined);
                    setImportanceFilter(undefined);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
          <CardDescription>
            Showing {reminders.length} of {pagination?.totalItems || 0} reminders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length > 0 ? (
            <>
              <DataTable
                columns={columns}
                data={reminders}
                searchable={true}
                searchPlaceholder="Search reminders..."
                pagination={false}
              />
              {/* Custom Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <p>No reminders found.</p>
              {statusFilter || importanceFilter ? (
                <p className="mt-2 text-sm">Try adjusting your filters.</p>
              ) : (
                <Link href="/reminders/new" className="mt-4 inline-block">
                  <Button>Create Your First Reminder</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


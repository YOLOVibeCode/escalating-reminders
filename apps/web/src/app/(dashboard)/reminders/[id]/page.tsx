/**
 * Reminder detail page.
 * View and edit individual reminder details.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useReminder,
  useUpdateReminder,
  useDeleteReminder,
  useSnoozeReminder,
  useCompleteReminder,
  useAcknowledgeReminder,
} from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, Button, Input } from '@er/ui-components';
import type { ReminderImportance } from '@er/types';
import { useQueryClient } from '@tanstack/react-query';

interface ReminderDetailPageProps {
  params: {
    id: string;
  };
}

export default function ReminderDetailPage({ params }: ReminderDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: reminder, isLoading, error } = useReminder(params.id);
  const updateMutation = useUpdateReminder();
  const deleteMutation = useDeleteReminder();
  const snoozeMutation = useSnoozeReminder();
  const completeMutation = useCompleteReminder();
  const acknowledgeMutation = useAcknowledgeReminder();
  const [snoozeDuration, setSnoozeDuration] = useState('1 hour');
  const [showSnoozeDialog, setShowSnoozeDialog] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<ReminderImportance>('MEDIUM');

  // Initialize form when reminder loads
  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDescription(reminder.description || '');
      setImportance(reminder.importance);
    }
  }, [reminder]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updateData: any = {
        title,
        importance,
      };
      if (description) {
        updateData.description = description;
      }

      await updateMutation.mutateAsync({
        id: params.id,
        data: {
          ...updateData,
        },
      });
      setIsEditing(false);
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reminder? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(params.id);
      router.push('/reminders');
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  const handleSnooze = async () => {
    try {
      await snoozeMutation.mutateAsync({ id: params.id, duration: snoozeDuration });
      setShowSnoozeDialog(false);
      await queryClient.invalidateQueries({ queryKey: ['reminders', params.id] });
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  const handleComplete = async () => {
    if (!confirm('Mark this reminder as complete?')) {
      return;
    }
    try {
      await completeMutation.mutateAsync({ id: params.id, source: 'manual' });
      await queryClient.invalidateQueries({ queryKey: ['reminders', params.id] });
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  const handleAcknowledge = async () => {
    try {
      await acknowledgeMutation.mutateAsync(params.id);
      await queryClient.invalidateQueries({ queryKey: ['reminders', params.id] });
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="reminder-loading">
        <div className="text-lg text-gray-600">Loading reminder...</div>
      </div>
    );
  }

  if (error || !reminder) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="reminder-error">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Reminder not found</h2>
          <p className="mt-2 text-gray-600">The reminder you're looking for doesn't exist.</p>
          <Link href="/reminders" className="mt-4 inline-block">
            <Button data-testid="back-to-reminders-button">Back to Reminders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const importanceColors = {
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    HIGH: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    SNOOZED: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    ARCHIVED: 'bg-gray-100 text-gray-400',
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/reminders" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Reminders
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Reminder' : reminder.title}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              {reminder.status === 'ACTIVE' && (
                <Dialog open={showSnoozeDialog} onOpenChange={setShowSnoozeDialog} data-testid="snooze-dialog">
                  <DialogTrigger>
                    <Button variant="outline" data-testid="snooze-trigger-button">Snooze</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Snooze Reminder</DialogTitle>
                      <DialogDescription>
                        Enter a duration for snoozing this reminder (e.g., "1 hour", "next Friday", "in 2 days")
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        id="snoozeDuration"
                        name="snoozeDuration"
                        data-testid="snooze-duration-input"
                        value={snoozeDuration}
                        onChange={(e) => setSnoozeDuration(e.target.value)}
                        placeholder="e.g., 1 hour, next Friday, in 2 days"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose>
                        <Button variant="outline" data-testid="snooze-cancel-button">Cancel</Button>
                      </DialogClose>
                      <Button
                        onClick={handleSnooze}
                        disabled={snoozeMutation.isPending || !snoozeDuration.trim()}
                        data-testid="snooze-confirm-button"
                      >
                        {snoozeMutation.isPending ? 'Snoozing...' : 'Snooze'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              {reminder.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  onClick={handleComplete}
                  disabled={completeMutation.isPending}
                  data-testid="complete-button"
                >
                  {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
                </Button>
              )}
              {reminder.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  onClick={handleAcknowledge}
                  disabled={acknowledgeMutation.isPending}
                  data-testid="acknowledge-button"
                >
                  {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="edit-button">
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending} data-testid="delete-button">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="cancel-edit-button">
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="save-edit-button">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} data-testid="reminder-edit-form">
          <Card>
            <CardHeader>
              <CardTitle>Edit Reminder</CardTitle>
              <CardDescription>Update reminder details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  data-testid="reminder-title-input"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  data-testid="reminder-description-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label htmlFor="importance" className="block text-sm font-medium text-gray-700">
                  Importance <span className="text-red-500">*</span>
                </label>
                <select
                  id="importance"
                  name="importance"
                  data-testid="reminder-importance-select"
                  required
                  value={importance}
                  onChange={(e) => setImportance(e.target.value as ReminderImportance)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Details</CardTitle>
                <div className="flex gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      importanceColors[reminder.importance]
                    }`}
                  >
                    {reminder.importance}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColors[reminder.status]
                    }`}
                  >
                    {reminder.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reminder.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Description</h3>
                  <p className="mt-1 text-sm text-gray-900">{reminder.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Next Trigger</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {reminder.nextTriggerAt
                      ? new Date(reminder.nextTriggerAt).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>

                {reminder.lastTriggeredAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Last Triggered</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(reminder.lastTriggeredAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Created</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(reminder.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700">Updated</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(reminder.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {reminder.escalationProfileId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Escalation Profile</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {reminder.escalationProfileId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


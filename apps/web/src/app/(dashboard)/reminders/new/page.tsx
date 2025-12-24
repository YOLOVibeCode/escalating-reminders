/**
 * Create reminder page.
 * Form for creating a new reminder.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateReminder, useEscalationProfiles } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, Input } from '@er/ui-components';
import type { CreateReminderDto, ReminderImportance, ScheduleType } from '@er/types';

export default function CreateReminderPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<ReminderImportance>('MEDIUM');
  const [escalationProfileId, setEscalationProfileId] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('ONCE');
  const [triggerAt, setTriggerAt] = useState(() => {
    // Pre-fill with 1 hour from now for better UX + stable E2E.
    const d = new Date(Date.now() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16); // yyyy-mm-ddThh:mm
  });
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [error, setError] = useState<string | null>(null);

  const { data: profiles, isLoading: profilesLoading } = useEscalationProfiles();
  const createMutation = useCreateReminder();

  // Auto-select the first escalation profile to avoid dead-end form state.
  useEffect(() => {
    if (!escalationProfileId && profiles && profiles.length > 0) {
      setEscalationProfileId(profiles[0]!.id);
    }
  }, [profiles, escalationProfileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!escalationProfileId) {
      setError('Please select an escalation profile');
      return;
    }

    try {
      const schedule: any = {
        type: scheduleType,
        timezone,
      };
      if (scheduleType === 'ONCE' && triggerAt) {
        schedule.triggerAt = new Date(triggerAt);
      }

      const reminderData: CreateReminderDto = {
        title,
        ...(description ? { description } : {}),
        importance,
        escalationProfileId,
        schedule,
      };

      const reminder = await createMutation.mutateAsync(reminderData);
      router.push(`/reminders/${reminder.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reminder. Please try again.');
    }
  };

  if (profilesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Reminder</h1>
        <p className="mt-1 text-sm text-gray-600">Set up a new reminder with escalation</p>
      </div>

      <form onSubmit={handleSubmit} data-testid="reminder-form">
        <Card>
          <CardHeader>
            <CardTitle>Reminder Details</CardTitle>
            <CardDescription>Basic information about your reminder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4" data-testid="reminder-error" role="alert">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                data-testid="title-input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                placeholder="e.g., Call dentist"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                data-testid="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="Additional details about this reminder"
              />
            </div>

            <div>
              <label htmlFor="importance" className="block text-sm font-medium text-gray-700">
                Importance <span className="text-red-500">*</span>
              </label>
              <select
                id="importance"
                name="importance"
                data-testid="importance-select"
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

        <Card>
          <CardHeader>
            <CardTitle>Escalation Profile</CardTitle>
            <CardDescription>Choose how this reminder should escalate</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label htmlFor="escalationProfile" className="block text-sm font-medium text-gray-700">
                Profile <span className="text-red-500">*</span>
              </label>
              <select
                id="escalationProfile"
                name="escalationProfileId"
                data-testid="escalation-select"
                required
                value={escalationProfileId}
                onChange={(e) => setEscalationProfileId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a profile...</option>
                {profiles?.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} {profile.isPreset ? '(Preset)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>When should this reminder trigger?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="scheduleType" className="block text-sm font-medium text-gray-700">
                Schedule Type <span className="text-red-500">*</span>
              </label>
              <select
                id="scheduleType"
                name="scheduleType"
                data-testid="schedule-type-select"
                required
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="ONCE">Once</option>
                <option value="RECURRING">Recurring</option>
                <option value="INTERVAL">Interval</option>
              </select>
            </div>

            {scheduleType === 'ONCE' && (
              <div>
                <label htmlFor="triggerAt" className="block text-sm font-medium text-gray-700">
                  Trigger Date & Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="triggerAt"
                data-testid="triggerAt-input"
                  type="datetime-local"
                  required
                  value={triggerAt}
                  onChange={(e) => setTriggerAt(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {scheduleType === 'RECURRING' && (
              <div>
                <label htmlFor="cronExpression" className="block text-sm font-medium text-gray-700">
                  Cron Expression <span className="text-red-500">*</span>
                </label>
                <Input
                  id="cronExpression"
                  placeholder="0 9 * * * (9 AM daily)"
                  className="mt-1"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cron expressions coming soon. For now, use "Once" schedule.
                </p>
              </div>
            )}

            {scheduleType === 'INTERVAL' && (
              <div>
                <label htmlFor="intervalMinutes" className="block text-sm font-medium text-gray-700">
                  Interval (minutes) <span className="text-red-500">*</span>
                </label>
                <Input
                  id="intervalMinutes"
                  type="number"
                  min="1"
                  placeholder="60"
                  className="mt-1"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">
                  Interval schedules coming soon. For now, use "Once" schedule.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <Input
                id="timezone"
                name="timezone"
                data-testid="timezone-input"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1"
                placeholder="America/New_York"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending} data-testid="submit-button">
            {createMutation.isPending ? 'Creating...' : 'Create Reminder'}
          </Button>
        </div>
      </form>
    </div>
  );
}


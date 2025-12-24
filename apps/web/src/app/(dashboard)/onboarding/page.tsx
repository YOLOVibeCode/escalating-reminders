/**
 * Onboarding wizard.
 * Helps a new user create their first escalation-enabled reminder.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@er/ui-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateReminder, useEscalationProfiles } from '@/lib/api-client';
import type { ReminderImportance, ScheduleType } from '@er/types';

const ONBOARDING_DONE_KEY = 'er_onboarding_completed_v1';

type WizardStep = 1 | 2 | 3;

function toDatetimeLocal(d: Date): string {
  return d.toISOString().slice(0, 16);
}

export default function OnboardingPage(): JSX.Element {
  const router = useRouter();
  const createMutation = useCreateReminder();
  const profilesQuery = useEscalationProfiles();
  const profiles = profilesQuery.data;
  const profilesLoading = profilesQuery.isLoading;
  const profilesError = profilesQuery.error as unknown;

  const [step, setStep] = useState<WizardStep>(1);
  const [title, setTitle] = useState('');
  const [importance, setImportance] = useState<ReminderImportance>('MEDIUM');
  const [scheduleType] = useState<ScheduleType>('ONCE');
  const [triggerAt, setTriggerAt] = useState(() => toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [escalationProfileId, setEscalationProfileId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recommendedProfileId = useMemo(() => {
    if (!profiles || profiles.length === 0) return '';
    const critical = profiles.find((p) => p.name === 'Critical');
    const gentle = profiles.find((p) => p.name === 'Gentle');
    const urgent = importance === 'HIGH' || importance === 'CRITICAL';
    return (urgent ? critical?.id : gentle?.id) || profiles[0]!.id;
  }, [profiles, importance]);

  useEffect(() => {
    if (!escalationProfileId && recommendedProfileId) {
      setEscalationProfileId(recommendedProfileId);
    }
  }, [escalationProfileId, recommendedProfileId]);

  const markDone = () => {
    try {
      window.localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const next = () => {
    setError(null);
    if (step === 1) {
      if (!title.trim()) {
        setError('Please enter a reminder title.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!triggerAt) {
        setError('Please choose when this reminder should trigger.');
        return;
      }
      setStep(3);
      return;
    }
  };

  const back = () => {
    setError(null);
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const skip = () => {
    markDone();
    router.push('/dashboard');
  };

  const createFirstReminder = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Please enter a reminder title.');
      setStep(1);
      return;
    }
    if (!triggerAt) {
      setError('Please choose when this reminder should trigger.');
      setStep(2);
      return;
    }
    if (!escalationProfileId) {
      setError('Please select an escalation profile.');
      return;
    }

    try {
      const reminder = await createMutation.mutateAsync({
        title: title.trim(),
        importance,
        escalationProfileId,
        schedule: {
          type: scheduleType,
          timezone,
          triggerAt: new Date(triggerAt),
        } as any,
      } as any);

      markDone();
      router.push(`/reminders/${reminder.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create reminder. Please try again.');
    }
  };

  if (profilesLoading) {
    return (
      <div className="container mx-auto max-w-2xl p-6" data-testid="onboarding">
        <div className="text-lg text-gray-600">Loading onboarding...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6" data-testid="onboarding">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
        <p className="text-sm text-gray-600">Let’s set up your first escalating reminder.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4" data-testid="onboarding-error">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {(!profiles || profiles.length === 0) && (
        <div className="rounded-md bg-yellow-50 p-4" data-testid="onboarding-profiles-error">
          <div className="text-sm font-medium text-yellow-900">Escalation profiles unavailable</div>
          <div className="mt-1 text-sm text-yellow-800">
            {profilesError instanceof Error ? profilesError.message : 'Please try again.'}
          </div>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" onClick={() => profilesQuery.refetch()} data-testid="onboarding-retry">
              Retry
            </Button>
            <Button type="button" onClick={skip} data-testid="onboarding-skip-from-error">
              Skip onboarding
            </Button>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600" data-testid="onboarding-step">
        Step {step} of 3
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>What do you want to remember?</CardTitle>
            <CardDescription>Give your reminder a clear title.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                name="title"
                data-testid="onboarding-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Call dentist"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>When should we remind you?</CardTitle>
            <CardDescription>You can change this later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="triggerAt" className="block text-sm font-medium text-gray-700">
                Trigger Date & Time <span className="text-red-500">*</span>
              </label>
              <Input
                id="triggerAt"
                type="datetime-local"
                data-testid="onboarding-triggerAt-input"
                value={triggerAt}
                onChange={(e) => setTriggerAt(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500">Timezone: {timezone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>How urgent is this?</CardTitle>
            <CardDescription>
              We’ll escalate across channels based on your selection. You can customize profiles later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="importance" className="block text-sm font-medium text-gray-700">
                Importance <span className="text-red-500">*</span>
              </label>
              <select
                id="importance"
                name="importance"
                data-testid="onboarding-importance-select"
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

            <div>
              <label htmlFor="escalationProfileId" className="block text-sm font-medium text-gray-700">
                Escalation Profile <span className="text-red-500">*</span>
              </label>
              <select
                id="escalationProfileId"
                name="escalationProfileId"
                data-testid="onboarding-escalation-select"
                value={escalationProfileId}
                onChange={(e) => setEscalationProfileId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!profiles || profiles.length === 0}
              >
                <option value="">Select a profile...</option>
                {(profiles || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isPreset ? '(Preset)' : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Recommended: {profiles?.find((p) => p.id === recommendedProfileId)?.name || '—'}
              </p>
            </div>

            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-900" data-testid="onboarding-summary">
              <div className="font-medium">Summary</div>
              <div className="mt-1">
                <div>
                  <span className="font-medium">Title:</span> {title.trim() || '—'}
                </div>
                <div>
                  <span className="font-medium">When:</span> {triggerAt || '—'}
                </div>
                <div>
                  <span className="font-medium">Importance:</span> {importance}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {step > 1 ? (
            <Button variant="outline" type="button" onClick={back} data-testid="onboarding-back">
              Back
            </Button>
          ) : (
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900" data-testid="onboarding-skip-link">
              Skip for now
            </Link>
          )}
        </div>

        <div className="flex gap-2">
          {step < 3 ? (
            <Button type="button" onClick={next} data-testid="onboarding-next">
              Next
            </Button>
          ) : (
            <>
              <Button variant="outline" type="button" onClick={skip} data-testid="onboarding-skip">
                Skip
              </Button>
              <Button
                type="button"
                onClick={createFirstReminder}
                data-testid="onboarding-create"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create my reminder'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/**
 * Create escalation profile page.
 * Form for creating a custom escalation profile.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateEscalationProfile, useAgents } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, Input } from '@er/ui-components';
import type { EscalationTier } from '@er/types';

export default function CreateEscalationProfilePage() {
  const router = useRouter();
  const { data: agents } = useAgents();
  const createMutation = useCreateEscalationProfile();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tiers, setTiers] = useState<EscalationTier[]>([
    {
      tierNumber: 1,
      delayMinutes: 0,
      agentIds: [],
      includeTrustedContacts: false,
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleAddTier = () => {
    setTiers([
      ...tiers,
      {
        tierNumber: tiers.length + 1,
        delayMinutes: 0,
        agentIds: [],
        includeTrustedContacts: false,
      },
    ]);
  };

  const handleRemoveTier = (tierIndex: number) => {
    if (tiers.length <= 1) {
      alert('You must have at least one tier');
      return;
    }
    const newTiers = tiers.filter((_, index) => index !== tierIndex);
    // Renumber tiers
    newTiers.forEach((tier, index) => {
      tier.tierNumber = index + 1;
    });
    setTiers(newTiers);
  };

  const handleTierChange = (
    tierIndex: number,
    field: keyof EscalationTier,
    value: unknown,
  ) => {
    const newTiers = [...tiers];
    (newTiers[tierIndex] as any)[field] = value;
    setTiers(newTiers);
  };

  const handleAgentToggle = (tierIndex: number, agentId: string) => {
    const tier = tiers[tierIndex];
    const agentIds = tier.agentIds || [];
    const newAgentIds = agentIds.includes(agentId)
      ? agentIds.filter((id) => id !== agentId)
      : [...agentIds, agentId];
    handleTierChange(tierIndex, 'agentIds', newAgentIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Profile name is required');
      return;
    }

    if (tiers.some((tier) => tier.agentIds.length === 0)) {
      setError('Each tier must have at least one agent');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        tiers,
      });
      router.push('/settings/escalation-profiles');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <Link
          href="/settings/escalation-profiles"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Escalation Profiles
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">Create Escalation Profile</h1>
        <p className="mt-1 text-sm text-gray-600">Define a custom escalation strategy</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Basic information about your escalation profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
                placeholder="e.g., My Custom Profile"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="Describe when to use this profile"
              />
            </div>
          </CardContent>
        </Card>

        {/* Escalation Tiers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Escalation Tiers</h2>
            <Button type="button" variant="outline" size="sm" onClick={handleAddTier}>
              Add Tier
            </Button>
          </div>

          {tiers.map((tier, tierIndex) => (
            <Card key={tierIndex}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tier {tier.tierNumber}</CardTitle>
                  {tiers.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveTier(tierIndex)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Delay (minutes)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={tier.delayMinutes}
                    onChange={(e) =>
                      handleTierChange(tierIndex, 'delayMinutes', parseInt(e.target.value) || 0)
                    }
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minutes to wait before advancing to this tier
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notification Agents <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-2 space-y-2">
                    {agents?.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center space-x-2 rounded border p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={tier.agentIds.includes(agent.type)}
                          onChange={() => handleAgentToggle(tierIndex, agent.type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{agent.name}</span>
                      </label>
                    ))}
                  </div>
                  {tier.agentIds.length === 0 && (
                    <p className="mt-1 text-xs text-red-600">Select at least one agent</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tier.includeTrustedContacts}
                      onChange={(e) =>
                        handleTierChange(tierIndex, 'includeTrustedContacts', e.target.checked)
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Include Trusted Contacts
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Notify trusted contacts at this tier
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Create Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}



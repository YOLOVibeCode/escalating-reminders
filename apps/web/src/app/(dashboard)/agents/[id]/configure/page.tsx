/**
 * Agent configuration page.
 * Subscribe to or configure an agent.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useAgents,
  useAgentSubscriptions,
  useSubscribeAgent,
  useUpdateAgentSubscription,
} from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, Input } from '@er/ui-components';
import type { AgentDefinition } from '@er/types';

interface AgentConfigurePageProps {
  params: {
    id: string;
  };
}

export default function AgentConfigurePage({ params }: AgentConfigurePageProps) {
  const router = useRouter();
  const { data: agents } = useAgents();
  const { data: subscriptions } = useAgentSubscriptions();

  const agent = agents?.find((a) => a.type === params.id);
  const existingSubscription = (subscriptions as any[])?.find((s: any) => s.agentDefinition?.type === params.id);

  const [configuration, setConfiguration] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const subscribeMutation = useSubscribeAgent();
  const updateMutation = useUpdateAgentSubscription();

  // Initialize configuration from existing subscription or schema
  useEffect(() => {
    if (existingSubscription) {
      setConfiguration(existingSubscription.configuration as Record<string, string>);
    } else if ((agent as any)?.configurationSchema?.fields) {
      const initialConfig: Record<string, string> = {};
      (agent as any).configurationSchema.fields.forEach((field: any) => {
        if (field.defaultValue) {
          initialConfig[field.key] = field.defaultValue;
        }
      });
      setConfiguration(initialConfig);
    }
  }, [agent, existingSubscription]);

  if (!agent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Agent not found</h2>
          <p className="mt-2 text-gray-600">The agent you're looking for doesn't exist.</p>
          <Link href="/agents" className="mt-4 inline-block">
            <Button>Back to Agents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (existingSubscription) {
        // Update existing subscription
        await updateMutation.mutateAsync({
          subscriptionId: existingSubscription.id,
          data: { configuration },
        });
      } else {
        // Create new subscription
        await subscribeMutation.mutateAsync({
          agentId: agent.id,
          data: { configuration },
        });
      }
      router.push('/agents/subscriptions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration. Please try again.');
    }
  };

  const fields = ((agent as any).configurationSchema?.fields as any[]) || [];

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link href="/agents" className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Agents
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {existingSubscription ? 'Configure' : 'Subscribe to'} {agent.name}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{agent.description}</p>
      </div>

      <form onSubmit={handleSubmit} data-testid="agent-config-form">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              {existingSubscription
                ? 'Update your agent configuration'
                : 'Configure your agent subscription'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4" data-testid="agent-config-error" role="alert">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {fields.length > 0 ? (
              fields.map((field: any) => (
                <div key={field.key}>
                  <label
                    htmlFor={field.key}
                    className="block text-sm font-medium text-gray-700"
                  >
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'text' || field.type === 'email' || field.type === 'url' ? (
                    <Input
                      id={field.key}
                      name={field.key}
                      type={field.type}
                      data-testid={`agent-config-${field.key}-input`}
                      required={field.required}
                      value={configuration[field.key] || ''}
                      onChange={(e) =>
                        setConfiguration({ ...configuration, [field.key]: e.target.value })
                      }
                      className="mt-1"
                      placeholder={field.placeholder}
                    />
                  ) : field.type === 'textarea' ? (
                    <textarea
                      id={field.key}
                      name={field.key}
                      data-testid={`agent-config-${field.key}-textarea`}
                      required={field.required}
                      value={configuration[field.key] || ''}
                      onChange={(e) =>
                        setConfiguration({ ...configuration, [field.key]: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={4}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      name={field.key}
                      type="text"
                      data-testid={`agent-config-${field.key}-input`}
                      required={field.required}
                      value={configuration[field.key] || ''}
                      onChange={(e) =>
                        setConfiguration({ ...configuration, [field.key]: e.target.value })
                      }
                      className="mt-1"
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.description && (
                    <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-md bg-gray-50 p-4">
                <p className="text-sm text-gray-600">
                  This agent doesn't require any configuration.
                </p>
              </div>
            )}

            {/* Special handling for webhook agent */}
            {agent.type === 'webhook' && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Webhook URL <span className="text-red-500">*</span>
                </label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  data-testid="agent-config-url-input"
                  required
                  value={configuration.url || ''}
                  onChange={(e) =>
                    setConfiguration({ ...configuration, url: e.target.value })
                  }
                  className="mt-1"
                  placeholder="https://example.com/webhook"
                />
                <p className="mt-1 text-xs text-gray-500">
                  The URL where notifications will be sent via HTTP POST.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={subscribeMutation.isPending || updateMutation.isPending}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={subscribeMutation.isPending || updateMutation.isPending} data-testid="submit-button">
            {subscribeMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : existingSubscription
                ? 'Update Configuration'
                : 'Subscribe'}
          </Button>
        </div>
      </form>
    </div>
  );
}


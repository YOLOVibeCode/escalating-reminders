/**
 * Agents list page.
 * Displays all available notification agents.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAgents, useAgentSubscriptions } from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@er/ui-components';
import type { AgentDefinition } from '@er/types';

export default function AgentsPage() {
  const { data: agents, isLoading: agentsLoading } = useAgents();
  const { data: subscriptions } = useAgentSubscriptions();

  const subscribedAgentTypes = new Set(subscriptions?.map((sub: any) => sub.agentDefinition?.type) || []);

  if (agentsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading agents...</div>
      </div>
    );
  }

  const subscribedAgents = agents?.filter((agent) => subscribedAgentTypes.has(agent.type)) || [];
  const availableAgents = agents?.filter((agent) => !subscribedAgentTypes.has(agent.type)) || [];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Agents</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your notification delivery channels
          </p>
        </div>
        <Link href="/agents/subscriptions">
          <Button variant="outline">View Subscriptions</Button>
        </Link>
      </div>

      {/* Subscribed Agents */}
      {subscribedAgents.length > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Active Subscriptions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subscribedAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isSubscribed={true} />
            ))}
          </div>
        </div>
      )}

      {/* Available Agents */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Available Agents</h2>
        {availableAgents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} isSubscribed={false} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <p>No additional agents available.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface AgentCardProps {
  agent: AgentDefinition;
  isSubscribed: boolean;
}

function AgentCard({ agent, isSubscribed }: AgentCardProps) {
  const capabilities = (agent.capabilities || {}) as any;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          {agent.isOfficial && (
            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
              Official
            </span>
          )}
        </div>
        <CardDescription>{agent.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-700">Minimum Tier</p>
            <p className="text-sm text-gray-600 capitalize">{agent.minimumTier}</p>
          </div>

          {agent.capabilities && (
            <div>
              <p className="text-xs font-medium text-gray-700">Capabilities</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {capabilities.canPush && (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                    Push
                  </span>
                )}
                {capabilities.canPull && (
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                    Pull
                  </span>
                )}
                {capabilities.canReceiveCommands && (
                  <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-800">
                    Commands
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            {isSubscribed ? (
              <Link href={`/agents/${agent.type}/configure`}>
                <Button className="w-full" variant="outline" data-testid={`configure-agent-${agent.type}-button`}>
                  Configure
                </Button>
              </Link>
            ) : (
              <Link href={`/agents/${agent.type}/configure`}>
                <Button className="w-full" data-testid={`subscribe-agent-${agent.type}-button`}>Subscribe</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


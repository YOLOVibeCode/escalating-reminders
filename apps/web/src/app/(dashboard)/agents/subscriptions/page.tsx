/**
 * Agent subscriptions page.
 * Manage all active agent subscriptions.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useAgentSubscriptions,
  useUnsubscribeAgent,
  useTestAgent,
} from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@er/ui-components';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@er/ui-components';
import type { UserAgentSubscription } from '@er/types';

export default function AgentSubscriptionsPage() {
  const { data: subscriptions, isLoading } = useAgentSubscriptions();
  const unsubscribeMutation = useUnsubscribeAgent();
  const testMutation = useTestAgent();

  const [testResult, setTestResult] = useState<{
    subscriptionId: string;
    success: boolean;
    message: string;
    deliveryTime?: number;
  } | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const handleUnsubscribe = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to unsubscribe from this agent?')) {
      return;
    }

    try {
      await unsubscribeMutation.mutateAsync(subscriptionId);
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  const handleTest = async (subscriptionId: string) => {
    try {
      const result = await testMutation.mutateAsync(subscriptionId);
      setTestResult({ subscriptionId, ...result });
      setTestDialogOpen(true);
    } catch (err) {
      setTestResult({
        subscriptionId,
        success: false,
        message: err instanceof Error ? err.message : 'Test failed',
      });
      setTestDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Subscriptions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your notification agent subscriptions ({subscriptions?.length || 0} active)
          </p>
        </div>
        <Link href="/agents">
          <Button variant="outline">Browse Agents</Button>
        </Link>
      </div>

      {subscriptions && subscriptions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onUnsubscribe={handleUnsubscribe}
              onTest={handleTest}
              isUnsubscribing={unsubscribeMutation.isPending}
              isTesting={testMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No active subscriptions.</p>
            <Link href="/agents" className="mt-4 inline-block">
              <Button>Browse Available Agents</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Test Result Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Result</DialogTitle>
            <DialogDescription>
              {testResult?.success
                ? 'The test notification was sent successfully.'
                : 'The test notification failed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div
              className={`rounded-md p-4 ${
                testResult?.success ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <p
                className={`text-sm ${
                  testResult?.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {testResult?.message}
              </p>
              {testResult?.deliveryTime && (
                <p className="mt-2 text-xs text-gray-600">
                  Delivery time: {testResult.deliveryTime.toFixed(2)}ms
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SubscriptionCardProps {
  subscription: UserAgentSubscription;
  onUnsubscribe: (id: string) => void;
  onTest: (id: string) => void;
  isUnsubscribing: boolean;
  isTesting: boolean;
}

function SubscriptionCard({
  subscription,
  onUnsubscribe,
  onTest,
  isUnsubscribing,
  isTesting,
}: SubscriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg capitalize">{subscription.agentType}</CardTitle>
          <span
            className={`rounded-full px-2 py-1 text-xs font-semibold ${
              subscription.isEnabled
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {subscription.isEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <CardDescription>Subscription ID: {subscription.id.slice(0, 8)}...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-gray-700">Configuration</p>
          <div className="mt-1 rounded bg-gray-50 p-2">
            <pre className="text-xs text-gray-600">
              {JSON.stringify(subscription.configuration, null, 2)}
            </pre>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/agents/${subscription.agentType}/configure`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              Configure
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(subscription.id)}
            disabled={isTesting}
          >
            {isTesting ? 'Testing...' : 'Test'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onUnsubscribe(subscription.id)}
            disabled={isUnsubscribing}
          >
            {isUnsubscribing ? '...' : 'Remove'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


/**
 * Admin Agents Page
 * View agent statistics
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@er/ui-components';
import { useAgentStats } from '@/lib/api-client';

export default function AdminAgentsPage() {
  const { data: agentStats, isLoading } = useAgentStats();

  if (isLoading) {
    return <div className="py-8 text-center">Loading agent statistics...</div>;
  }

  if (!agentStats) {
    return <div className="py-8 text-center">No agent data available</div>;
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatMs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentStats.totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentStats.activeAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentStats.totalSubscriptions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>By Agent Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(agentStats.byAgentType).map(([agentType, stats]) => (
              <div key={agentType} className="rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{agentType}</p>
                    <p className="text-xs text-gray-500">Subscriptions: {stats.subscriptions}</p>
                  </div>
                  <Badge variant={stats.successRate > 95 ? 'success' : stats.successRate > 85 ? 'warning' : 'danger'}>
                    Success: {formatPercent(stats.successRate)}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Sent</span>
                    <span className="font-semibold">{stats.notificationsSent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Error rate</span>
                    <span className="font-semibold">{formatPercent(stats.errorRate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Avg delivery</span>
                    <span className="font-semibold">{formatMs(stats.averageDeliveryTime)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

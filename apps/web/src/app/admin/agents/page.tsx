/**
 * Admin Agents Page
 * View agent statistics
 */

'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@er/ui-components';
import { useAgentStats } from '@/lib/api-client';

export default function AdminAgentsPage() {
  const { data: agentStats, isLoading } = useAgentStats();

  if (isLoading) {
    return <div className="py-8 text-center">Loading agent statistics...</div>;
  }

  if (!agentStats) {
    return <div className="py-8 text-center">No agent data available</div>;
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Agent Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agentStats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPercent(agentStats.successRate)}
            </div>
            <Badge
              variant={
                agentStats.successRate > 0.95
                  ? 'success'
                  : agentStats.successRate > 0.85
                  ? 'warning'
                  : 'danger'
              }
            >
              {agentStats.successRate > 0.95
                ? 'Excellent'
                : agentStats.successRate > 0.85
                ? 'Good'
                : 'Needs Attention'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg Execution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatTime(agentStats.averageExecutionTime)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Types */}
      <Card>
        <CardHeader>
          <CardTitle>Agents by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-md border p-4">
              <span className="font-medium">Webhook</span>
              <Badge variant="default">{agentStats.byType.WEBHOOK}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-4">
              <span className="font-medium">Slack</span>
              <Badge variant="default">{agentStats.byType.SLACK}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-4">
              <span className="font-medium">Email</span>
              <Badge variant="default">{agentStats.byType.EMAIL}</Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border p-4">
              <span className="font-medium">SMS</span>
              <Badge variant="default">{agentStats.byType.SMS}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

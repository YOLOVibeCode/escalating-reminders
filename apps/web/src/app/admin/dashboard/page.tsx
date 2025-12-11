/**
 * Admin Dashboard Overview Page
 * Displays key metrics and system status
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@er/ui-components';
import { useAdminDashboard } from '@/lib/api-client';

export default function AdminDashboardPage() {
  const { data: dashboard, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Failed to load dashboard data. Please try again.
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getQueueStatus = (depth: number): 'success' | 'warning' | 'danger' => {
    if (depth < 10) return 'success';
    if (depth < 50) return 'warning';
    return 'danger';
  };

  const totalQueueDepth =
    dashboard.queueDepth.reminder +
    dashboard.queueDepth.notification +
    dashboard.queueDepth.escalation +
    dashboard.queueDepth.agent;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* MRR Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(dashboard.mrr)}</div>
            <p className="mt-1 text-xs text-gray-500">
              ARR: {formatCurrency(dashboard.arr)}
            </p>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.activeUsers}</div>
            <p className="mt-1 text-xs text-gray-500">
              +{dashboard.newUsersToday} new today
            </p>
          </CardContent>
        </Card>

        {/* Active Reminders Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Active Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.activeReminders}</div>
            <p className="mt-1 text-xs text-gray-500">In progress</p>
          </CardContent>
        </Card>

        {/* Delivery Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Notification Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatPercent(dashboard.notificationDeliveryRate)}
            </div>
            <div className="mt-2">
              <Badge
                variant={
                  dashboard.notificationDeliveryRate > 0.95
                    ? 'success'
                    : dashboard.notificationDeliveryRate > 0.85
                    ? 'warning'
                    : 'danger'
                }
              >
                {dashboard.notificationDeliveryRate > 0.95
                  ? 'Excellent'
                  : dashboard.notificationDeliveryRate > 0.85
                  ? 'Good'
                  : 'Needs Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Queue Depth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Queue Depth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalQueueDepth}</div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Reminder:</span>
                <Badge variant={getQueueStatus(dashboard.queueDepth.reminder)}>
                  {dashboard.queueDepth.reminder}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Notification:</span>
                <Badge variant={getQueueStatus(dashboard.queueDepth.notification)}>
                  {dashboard.queueDepth.notification}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Escalation:</span>
                <Badge variant={getQueueStatus(dashboard.queueDepth.escalation)}>
                  {dashboard.queueDepth.escalation}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agent:</span>
                <Badge variant={getQueueStatus(dashboard.queueDepth.agent)}>
                  {dashboard.queueDepth.agent}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Recent Errors (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.recentErrors}</div>
            <div className="mt-2">
              <Badge
                variant={
                  dashboard.recentErrors === 0
                    ? 'success'
                    : dashboard.recentErrors < 10
                    ? 'warning'
                    : 'danger'
                }
              >
                {dashboard.recentErrors === 0
                  ? 'No Errors'
                  : dashboard.recentErrors < 10
                  ? 'Minor Issues'
                  : 'Needs Investigation'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-900">
              All Systems Operational
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

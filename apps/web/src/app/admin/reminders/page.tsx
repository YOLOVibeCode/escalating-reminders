/**
 * Admin Reminders Page
 * View reminders, notifications, and escalation statistics
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@er/ui-components';
import { useReminderStats, useNotificationStats, useEscalationStats } from '@/lib/api-client';

export default function AdminRemindersPage() {
  const { data: reminderStats, isLoading: remindersLoading } = useReminderStats();
  const { data: notificationStats, isLoading: notificationsLoading } = useNotificationStats();
  const { data: escalationStats, isLoading: escalationsLoading } = useEscalationStats();

  if (remindersLoading || notificationsLoading || escalationsLoading) {
    return <div className="py-8 text-center">Loading statistics...</div>;
  }

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatMs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  return (
    <div className="space-y-6">
      {reminderStats && (
        <>
          <h3 className="text-lg font-semibold">Reminders</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Snoozed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.snoozed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Archived</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.archived}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Avg completion time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.averageCompletionTime.toFixed(1)}h</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>By Importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(reminderStats.byImportance).map(([importance, count]) => (
                  <div key={importance} className="flex items-center justify-between">
                    <span>{importance}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {notificationStats && (
        <>
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{notificationStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{notificationStats.delivered}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{notificationStats.failed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Delivery Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatPercent(notificationStats.deliveryRate)}</div>
                <div className="mt-2">
                  <Badge
                    variant={notificationStats.deliveryRate > 95 ? 'success' : notificationStats.deliveryRate > 85 ? 'warning' : 'danger'}
                  >
                    {notificationStats.deliveryRate > 95 ? 'Excellent' : notificationStats.deliveryRate > 85 ? 'Good' : 'Needs Attention'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>By Agent Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(notificationStats.byAgentType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span>{type}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
                <div className="pt-2 text-xs text-gray-500">
                  Avg delivery time: {formatMs(notificationStats.averageDeliveryTime)}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {escalationStats && (
        <>
          <h3 className="text-lg font-semibold">Escalations</h3>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.totalEscalations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.activeEscalations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Average Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.averageTier.toFixed(1)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">Max Tier Reached</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.maxTierReached}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>By Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(escalationStats.byTier).map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span>Tier {tier}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

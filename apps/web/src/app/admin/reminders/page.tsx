/**
 * Admin Reminders Page
 * View reminder statistics
 */

'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@er/ui-components';
import {
  useReminderStats,
  useNotificationStats,
  useEscalationStats,
} from '@/lib/api-client';

export default function AdminRemindersPage() {
  const { data: reminderStats, isLoading: remindersLoading } = useReminderStats();
  const { data: notificationStats, isLoading: notificationsLoading } = useNotificationStats();
  const { data: escalationStats, isLoading: escalationsLoading } = useEscalationStats();

  if (remindersLoading || notificationsLoading || escalationsLoading) {
    return <div className="py-8 text-center">Loading reminder statistics...</div>;
  }

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Reminder Stats */}
      {reminderStats && (
        <>
          <h3 className="text-lg font-semibold">Reminders</h3>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Avg Completion Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatTime(reminderStats.averageCompletionTime)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Snoozed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.snoozed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Escalated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reminderStats.escalated}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Notification Stats */}
      {notificationStats && (
        <>
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{notificationStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{notificationStats.sent}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {notificationStats.failed}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Delivery Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatPercent(notificationStats.deliveryRate)}
                </div>
                <Badge
                  variant={
                    notificationStats.deliveryRate > 0.95
                      ? 'success'
                      : notificationStats.deliveryRate > 0.85
                      ? 'warning'
                      : 'danger'
                  }
                >
                  {notificationStats.deliveryRate > 0.95
                    ? 'Excellent'
                    : notificationStats.deliveryRate > 0.85
                    ? 'Good'
                    : 'Poor'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Avg Delivery Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatTime(notificationStats.averageDeliveryTime)}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Escalation Stats */}
      {escalationStats && (
        <>
          <h3 className="text-lg font-semibold">Escalations</h3>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Escalations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.active}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Avg Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {escalationStats.averageEscalationLevel.toFixed(1)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-500">
                  Max Level Reached
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{escalationStats.maxLevelReached}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

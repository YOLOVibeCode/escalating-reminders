/**
 * Admin System Health Page
 * Monitor system health and performance
 */

'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Button,
} from '@er/ui-components';
import { useSystemHealth, useSystemHealthHistory } from '@/lib/api-client';

export default function AdminSystemPage() {
  const { data: health, isLoading, refetch } = useSystemHealth();
  const { data: history } = useSystemHealthHistory({ hours: 24 });

  if (isLoading) {
    return <div className="py-8 text-center">Loading system health...</div>;
  }

  if (!health) {
    return <div className="py-8 text-center">No health data available</div>;
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'down':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getQueueStatus = (waiting: number, failed: number): 'success' | 'warning' | 'danger' => {
    if (failed > 10 || waiting > 100) return 'danger';
    if (failed > 5 || waiting > 50) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">System Health Status</h2>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(health.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={() => refetch()} size="sm">
          Refresh
        </Button>
      </div>

      {/* Infrastructure Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(health.database.status)}>
                {health.database.status.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Connections: {health.database.connections}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Redis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge variant={getStatusBadgeVariant(health.redis.status)}>
                {health.redis.status.toUpperCase()}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Memory: {health.redis.memoryUsedMb.toFixed(1)} MB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">
              Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{health.workers.active}</div>
            <p className="mt-1 text-sm text-gray-500">
              {health.workers.idle} idle / {health.workers.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(health.queues).map(([queueName, stats]: [string, any]) => (
                <TableRow key={queueName}>
                  <TableCell className="font-medium capitalize">{queueName}</TableCell>
                  <TableCell>{stats.waiting}</TableCell>
                  <TableCell>{stats.active}</TableCell>
                  <TableCell>{stats.completed}</TableCell>
                  <TableCell>{stats.failed}</TableCell>
                  <TableCell>
                    <Badge variant={getQueueStatus(stats.waiting, stats.failed)}>
                      {getQueueStatus(stats.waiting, stats.failed) === 'success'
                        ? 'Healthy'
                        : getQueueStatus(stats.waiting, stats.failed) === 'warning'
                        ? 'Warning'
                        : 'Critical'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Health History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Health History (Last 24 Hours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 10).map((snapshot: any) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="secondary">
                      DB: {snapshot.data.database?.status || 'unknown'}
                    </Badge>
                    <Badge variant="secondary">
                      Redis: {snapshot.data.redis?.status || 'unknown'}
                    </Badge>
                    <Badge variant="secondary">
                      Workers: {snapshot.data.workers?.active || 0}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

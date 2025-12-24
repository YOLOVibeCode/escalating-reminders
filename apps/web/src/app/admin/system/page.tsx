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
  const { data: history } = useSystemHealthHistory({ limit: 25 });

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

  const memoryMb = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-testid="health-status">
        <div>
          <h2 className="text-xl font-bold">System Health</h2>
          <p className="text-sm text-gray-500">Last updated: {new Date(health.timestamp).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusBadgeVariant(health.status)}>{health.status.toUpperCase()}</Badge>
          <Button onClick={() => refetch()} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Infra cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Database</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pool size</span>
              <span className="font-semibold">{health.database.connectionPoolSize}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold">{health.database.activeConnections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Idle</span>
              <span className="font-semibold">{health.database.idleConnections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Slow queries (1h)</span>
              <span className="font-semibold">{health.database.slowQueries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg query time</span>
              <span className="font-semibold">{health.database.queryTime}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Redis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connected</span>
              <Badge variant={health.redis.connected ? 'success' : 'danger'}>
                {health.redis.connected ? 'YES' : 'NO'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory used</span>
              <span className="font-semibold">{memoryMb(health.redis.memoryUsed)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory max</span>
              <span className="font-semibold">{memoryMb(health.redis.memoryMax)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hit rate</span>
              <span className="font-semibold">{health.redis.hitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Keys</span>
              <span className="font-semibold">{health.redis.keys}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Workers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-semibold">{health.workers.totalWorkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active</span>
              <span className="font-semibold">{health.workers.activeWorkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Idle</span>
              <span className="font-semibold">{health.workers.idleWorkers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processed</span>
              <span className="font-semibold">{health.workers.jobsProcessed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed</span>
              <span className="font-semibold">{health.workers.jobsFailed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue table */}
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
                <TableHead>Delayed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(health.queues).map(([queueName, stats]: [string, any]) => (
                <TableRow key={queueName}>
                  <TableCell className="font-medium">{queueName}</TableCell>
                  <TableCell>{stats.waiting}</TableCell>
                  <TableCell>{stats.active}</TableCell>
                  <TableCell>{stats.completed}</TableCell>
                  <TableCell>{stats.failed}</TableCell>
                  <TableCell>{stats.delayed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Snapshot history */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Health Snapshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 10).map((snapshot: any) => (
                <div key={snapshot.id} className="flex items-center justify-between border-b py-2 last:border-0">
                  <span className="text-sm font-medium">{new Date(snapshot.timestamp).toLocaleString()}</span>
                  <span className="text-xs text-gray-500">errors: {snapshot.errorCount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

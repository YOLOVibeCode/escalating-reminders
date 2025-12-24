/**
 * Admin Billing Page
 * View billing stats and revenue metrics
 */

'use client';

import { useState } from 'react';
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
import { useBillingStats, useRevenueMetrics, useSubscriptions } from '@/lib/api-client';

export default function AdminBillingPage() {
  const [page, setPage] = useState(1);

  const { data: billingStats, isLoading: statsLoading } = useBillingStats();
  const { data: revenueMetrics, isLoading: revenueLoading } = useRevenueMetrics();
  const { data: subscriptionsData, isLoading: subsLoading } = useSubscriptions({ page, pageSize: 20 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (statsLoading) {
    return <div className="py-8 text-center">Loading billing data...</div>;
  }

  return (
    <div className="space-y-6" data-testid="billing-content">
      {/* Core Billing Stats */}
      {billingStats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(billingStats.mrr)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">ARR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(billingStats.arr)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Active Subs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{billingStats.activeSubscriptions}</div>
              <p className="mt-1 text-xs text-gray-500">
                Total: {billingStats.totalSubscriptions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Churn Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatPercent(billingStats.churnRate)}</div>
              <div className="mt-2">
                <Badge
                  variant={
                    billingStats.churnRate < 5 ? 'success' : billingStats.churnRate < 10 ? 'warning' : 'danger'
                  }
                >
                  {billingStats.churnRate < 5 ? 'Excellent' : billingStats.churnRate < 10 ? 'Normal' : 'High'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Breakdown */}
      {billingStats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Canceled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{billingStats.canceledSubscriptions}</div>
              <p className="mt-1 text-xs text-gray-500">Past due: {billingStats.pastDueSubscriptions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Subscriptions by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {Object.entries(billingStats.byTier).map(([tier, count]) => (
                  <div key={tier} className="flex justify-between">
                    <span>{tier}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">Revenue Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueLoading || !revenueMetrics ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total revenue</span>
                    <span className="font-semibold">{formatCurrency(revenueMetrics.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LTV</span>
                    <span className="font-semibold">{formatCurrency(revenueMetrics.ltv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Churn</span>
                    <span className="font-semibold">{formatPercent(revenueMetrics.churnRate)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Trend */}
      {revenueMetrics && !revenueLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revenueMetrics.revenueByMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between border-b py-2 last:border-0">
                  <span className="text-sm font-medium">{item.month}</span>
                  <span className="text-sm font-bold">{formatCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <div className="py-4 text-center text-gray-500">Loading...</div>
          ) : !subscriptionsData?.items?.length ? (
            <div className="py-4 text-center text-gray-500">No subscriptions found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionsData.items.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.user?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sub.tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'ACTIVE' ? 'success' : 'secondary'}>{sub.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(sub.currentPeriodStart).toLocaleDateString()} -{' '}
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {subscriptionsData.pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {subscriptionsData.items.length} of {subscriptionsData.pagination.totalItems} subscriptions
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {page} of {subscriptionsData.pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= subscriptionsData.pagination.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

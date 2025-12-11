/**
 * Admin Billing Page
 * View billing stats and revenue metrics
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
} from '@er/ui-components';
import { useBillingStats, useRevenueMetrics, useSubscriptions } from '@/lib/api-client';
import { useState } from 'react';

export default function AdminBillingPage() {
  const [page, setPage] = useState(1);
  const { data: billingStats, isLoading: statsLoading } = useBillingStats();
  const { data: revenueMetrics, isLoading: revenueLoading } = useRevenueMetrics({ months: 12 });
  const { data: subscriptionsData, isLoading: subsLoading } = useSubscriptions({ page, limit: 20 });

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

  if (statsLoading) {
    return <div className="py-8 text-center">Loading billing data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      {billingStats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Monthly Recurring Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(billingStats.mrr)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Annual Recurring Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(billingStats.arr)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Lifetime Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(billingStats.ltv)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Churn Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatPercent(billingStats.churnRate)}</div>
              <Badge
                variant={
                  billingStats.churnRate < 0.05
                    ? 'success'
                    : billingStats.churnRate < 0.1
                    ? 'warning'
                    : 'danger'
                }
              >
                {billingStats.churnRate < 0.05
                  ? 'Excellent'
                  : billingStats.churnRate < 0.1
                  ? 'Normal'
                  : 'High'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscription Stats */}
      {billingStats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{billingStats.activeSubscriptions}</div>
              <p className="mt-1 text-xs text-gray-500">
                +{billingStats.newSubscriptionsToday} new today
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Cancelled Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{billingStats.cancelledSubscriptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Revenue by Tier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Free:</span>
                  <span className="font-semibold">{formatCurrency(billingStats.revenueByTier.FREE)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Basic:</span>
                  <span className="font-semibold">{formatCurrency(billingStats.revenueByTier.BASIC)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro:</span>
                  <span className="font-semibold">{formatCurrency(billingStats.revenueByTier.PRO)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enterprise:</span>
                  <span className="font-semibold">{formatCurrency(billingStats.revenueByTier.ENTERPRISE)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Trend */}
      {revenueMetrics && !revenueLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {revenueMetrics.revenueByMonth.map((item: any) => (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
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
                      <Badge>{sub.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.status === 'ACTIVE'
                            ? 'success'
                            : sub.status === 'CANCELLED'
                            ? 'danger'
                            : 'secondary'
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(sub.currentPeriodStart).toLocaleDateString()} -{' '}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

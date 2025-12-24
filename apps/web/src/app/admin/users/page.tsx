/**
 * Admin Users Page
 * List and manage all users
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Input,
  Select,
} from '@er/ui-components';
import { useUsers, useUserStats, useSuspendUser, useUnsuspendUser } from '@/lib/api-client';

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const userFilters: any = { page, pageSize: 20 };
  if (search) userFilters.search = search;
  if (tierFilter) userFilters.tier = tierFilter;

  const { data: usersData, isLoading } = useUsers(userFilters);

  const { data: stats } = useUserStats();
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();

  const handleSuspend = async (userId: string) => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;

    try {
      await suspendMutation.mutateAsync({ userId, reason });
      alert('User suspended successfully');
    } catch (error) {
      alert('Failed to suspend user');
    }
  };

  const handleUnsuspend = async (userId: string) => {
    if (!confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      await unsuspendMutation.mutateAsync(userId);
      alert('User unsuspended successfully');
    } catch (error) {
      alert('Failed to unsuspend user');
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'secondary';
      case 'PERSONAL':
        return 'default';
      case 'PRO':
        return 'success';
      case 'FAMILY':
        return 'warning';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                New Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.newToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500">
                New This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.newThisWeek}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
              >
                <option value="">All Tiers</option>
                <option value="FREE">Free</option>
                <option value="PERSONAL">Personal</option>
                <option value="PRO">Pro</option>
                <option value="FAMILY">Family</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : !usersData?.items?.length ? (
            <div className="py-8 text-center text-gray-500">No users found</div>
          ) : (
            <>
              <Table data-testid="users-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData.items.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        {user.profile?.displayName || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTierBadgeVariant(user.subscription?.tier || 'FREE')}>
                          {user.subscription?.tier || 'FREE'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admin/users/${user.id}`} data-testid="user-link">
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSuspend(user.id)}
                            disabled={suspendMutation.isPending}
                          >
                            Suspend
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnsuspend(user.id)}
                            disabled={unsuspendMutation.isPending}
                          >
                            Unsuspend
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {usersData.pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {usersData.items.length} of {usersData.pagination.totalItems} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-3 text-sm">
                      Page {page} of {usersData.pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= usersData.pagination.totalPages}
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


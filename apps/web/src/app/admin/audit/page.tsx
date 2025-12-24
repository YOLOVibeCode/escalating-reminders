/**
 * Admin Audit Log Page
 * View all admin actions
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
  Select,
  Input,
} from '@er/ui-components';
import { useAuditLog } from '@/lib/api-client';

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [adminUserIdFilter, setAdminUserIdFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const auditFilters: any = { page, pageSize: 50 };
  if (actionFilter) auditFilters.action = actionFilter;
  if (adminUserIdFilter) auditFilters.adminUserId = adminUserIdFilter;
  if (targetTypeFilter) auditFilters.targetType = targetTypeFilter;

  const { data: auditData, isLoading } = useAuditLog(auditFilters);

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('DELETE') || action.includes('SUSPEND')) {
      return 'danger';
    }
    if (action.includes('CREATE') || action.includes('PROMOTE')) {
      return 'success';
    }
    if (action.includes('UPDATE') || action.includes('MODIFY')) {
      return 'warning';
    }
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-48"
            >
              <option value="">All Actions</option>
              <option value="USER_SUSPENDED">Suspend User</option>
              <option value="USER_UNSUSPENDED">Unsuspend User</option>
              <option value="USER_DELETED">Delete User</option>
              <option value="ADMIN_PROMOTED">Promote Admin</option>
              <option value="ADMIN_DEMOTED">Demote Admin</option>
              <option value="SUPPORT_NOTE_CREATED">Create Note</option>
            </Select>
            <Input
              type="text"
              placeholder="Admin ID..."
              value={adminUserIdFilter}
              onChange={(e) => setAdminUserIdFilter(e.target.value)}
              className="w-64"
            />
            <Select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="w-48"
            >
              <option value="">All Target Types</option>
              <option value="User">User</option>
              <option value="AdminUser">Admin User</option>
              <option value="Subscription">Subscription</option>
              <option value="SupportNote">Support Note</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : !auditData?.items?.length ? (
            <div className="py-8 text-center text-gray-500">No audit records found</div>
          ) : (
            <>
              <Table data-testid="audit-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditData.items.map((action: any) => (
                    <TableRow key={action.id}>
                      <TableCell className="text-sm">
                        {new Date(action.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {action.adminUser?.user?.email || action.adminUserId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(action.action)}>
                          {action.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>
                          <span className="font-medium">{action.targetType}</span>
                          <br />
                          <span className="text-xs text-gray-500">
                            {action.targetId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {action.reason || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {action.ipAddress || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {auditData.pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {auditData.items.length} of {auditData.pagination.totalItems} actions
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
                      Page {page} of {auditData.pagination.totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= auditData.pagination.totalPages}
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


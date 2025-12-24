/**
 * Admin User Details Page
 * View and manage individual user
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
} from '@er/ui-components';
import {
  useUserDetails,
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useCreateSupportNote,
} from '@/lib/api-client';

export default function AdminUserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [noteContent, setNoteContent] = useState('');

  const { data: userDetails, isLoading } = useUserDetails(params.id);
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const deleteMutation = useDeleteUser();
  const createNoteMutation = useCreateSupportNote();

  if (isLoading) {
    return <div className="py-8 text-center">Loading user details...</div>;
  }

  if (!userDetails) {
    return <div className="py-8 text-center">User not found</div>;
  }

  const { user, subscription, agentSubscriptions, supportNotes, remindersCount, activeRemindersCount } =
    userDetails as any;

  const handleSuspend = async () => {
    const reason = prompt('Enter reason for suspension:');
    if (!reason) return;

    try {
      await suspendMutation.mutateAsync({ userId: user.id, reason });
      alert('User suspended successfully');
    } catch (error) {
      alert('Failed to suspend user');
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      await unsuspendMutation.mutateAsync(user.id);
      alert('User unsuspended successfully');
    } catch (error) {
      alert('Failed to unsuspend user');
    }
  };

  const handleDelete = async () => {
    const reason = prompt('Enter reason for deletion (WARNING: This is permanent):');
    if (!reason) return;

    if (!confirm('Are you ABSOLUTELY sure? This cannot be undone!')) return;

    try {
      await deleteMutation.mutateAsync({ userId: user.id, reason });
      alert('User deleted successfully');
      router.push('/admin/users');
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;

    try {
      await createNoteMutation.mutateAsync({
        userId: user.id,
        content: noteContent,
      });
      setNoteContent('');
      alert('Note added successfully');
    } catch (error) {
      alert('Failed to add note');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{user.email}</h1>
          <p className="text-sm text-gray-500">
            User ID: {user.id}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Back to Users
          </Button>
          <Button
            variant="outline"
            onClick={handleSuspend}
            disabled={suspendMutation.isPending}
          >
            Suspend User
          </Button>
          <Button
            variant="outline"
            onClick={handleUnsuspend}
            disabled={unsuspendMutation.isPending}
          >
            Unsuspend User
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-red-600 hover:bg-red-50"
          >
            Delete User
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">
            Support Notes ({supportNotes?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Display Name</p>
                  <p className="text-sm">{user.profile?.displayName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge variant="secondary">N/A</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Subscription Tier</p>
                  <Badge>{subscription?.tier || 'FREE'}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm">
                    {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {subscription ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Plan</p>
                      <p className="text-sm">{subscription.tier}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <Badge
                        variant={subscription.status === 'ACTIVE' ? 'success' : 'secondary'}
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Current Period
                      </p>
                      <p className="text-sm">
                        {new Date(subscription.currentPeriodStart).toLocaleDateString()} -{' '}
                        {subscription.currentPeriodEnd
                          ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active subscription</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reminders (total)</span>
                  <Badge variant="secondary">{remindersCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reminders (active)</span>
                  <Badge variant="secondary">{activeRemindersCount}</Badge>
                </div>
                <div className="pt-4">
                  <p className="text-sm font-medium">Agent Subscriptions</p>
                  <div className="mt-2 space-y-2">
                    {agentSubscriptions?.map((sub: any) => (
                      <div key={sub.id} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{sub.agentDefinition?.name || sub.agentDefinitionId}</span>
                          <Badge variant={sub.isEnabled ? 'success' : 'secondary'}>
                            {sub.isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        {sub.agentDefinition?.type && (
                          <p className="mt-1 text-xs text-gray-500">Type: {sub.agentDefinition.type}</p>
                        )}
                      </div>
                    ))}
                    {!agentSubscriptions?.length && (
                      <p className="text-sm text-gray-500">No agent subscriptions</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Support Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Note Form */}
              <div className="space-y-3 rounded-md border p-4">
                <p className="text-sm font-medium">Add New Note</p>
                <Input
                  placeholder="Enter support note..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteContent.trim() || createNoteMutation.isPending}
                >
                  Add Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {supportNotes?.map((note: any) => (
                  <div key={note.id} className="rounded-md border p-4">
                    <p className="text-sm">{note.content}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
                {!supportNotes?.length && (
                  <p className="text-sm text-gray-500">No support notes</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


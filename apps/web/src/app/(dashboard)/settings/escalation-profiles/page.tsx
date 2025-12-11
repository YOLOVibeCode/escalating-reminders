/**
 * Escalation profiles management page.
 * View and manage custom escalation profiles.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useEscalationProfiles,
  useDeleteEscalationProfile,
} from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, DataTable } from '@er/ui-components';
import type { EscalationProfile } from '@er/types';
import type { ColumnDef } from '@tanstack/react-table';

const columns: ColumnDef<EscalationProfile>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.isPreset && (
          <span className="text-xs text-gray-500">(Preset)</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-sm text-gray-600">
        {row.original.description || 'No description'}
      </span>
    ),
  },
  {
    accessorKey: 'tiers',
    header: 'Tiers',
    cell: ({ row }) => {
      const tiers = row.original.tiers as Array<{ tierNumber: number }>;
      return <span className="text-sm">{tiers?.length || 0} tiers</span>;
    },
  },
];

export default function EscalationProfilesPage() {
  const { data: profiles, isLoading } = useEscalationProfiles();
  const deleteMutation = useDeleteEscalationProfile();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this escalation profile?')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      // Error handling is done by React Query
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading profiles...</div>
      </div>
    );
  }

  const customProfiles = profiles?.filter((p) => !p.isPreset) || [];
  const presetProfiles = profiles?.filter((p) => p.isPreset) || [];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/settings" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Settings
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Escalation Profiles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your custom escalation profiles ({customProfiles.length} custom,{' '}
            {presetProfiles.length} presets)
          </p>
        </div>
        <Link href="/settings/escalation-profiles/new">
          <Button>Create Profile</Button>
        </Link>
      </div>

      {/* Custom Profiles */}
      {customProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Custom Profiles</CardTitle>
            <CardDescription>Profiles you've created</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                ...columns,
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: ({ row }) => {
                    const profile = row.original;
                    return (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(profile.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              data={customProfiles}
              searchable={true}
              pagination={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Preset Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Profiles</CardTitle>
          <CardDescription>Built-in escalation profiles</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={presetProfiles}
            searchable={true}
            pagination={false}
          />
        </CardContent>
      </Card>

      {customProfiles.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">No custom profiles yet.</p>
            <p className="mt-2 text-sm text-gray-500">
              Create custom escalation profiles to match your specific needs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


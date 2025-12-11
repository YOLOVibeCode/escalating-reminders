/**
 * Admin root page - redirects to dashboard
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-lg">Redirecting to dashboard...</div>
    </div>
  );
}

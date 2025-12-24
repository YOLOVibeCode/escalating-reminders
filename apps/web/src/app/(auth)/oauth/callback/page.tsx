/**
 * OAuth callback page.
 * Handles OAuth provider redirects and completes authentication.
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { apiClient } from '@/lib/api-client';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      setLoading(false);
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (accessToken && refreshToken) {
      // Store tokens
      useAuthStore.getState().setTokens({
        accessToken,
        refreshToken,
      });

      setLoading(false);

      // Check if new user
      const isNewUser = searchParams.get('isNewUser') === 'true';

      // Redirect to appropriate dashboard
      // Use replace to avoid back button issues, and window.location for reliability
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    // If no tokens and no error, still loading (waiting for backend redirect)
    // This handles the case where backend redirects with tokens
    setLoading(true);
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-lg font-semibold text-gray-900">
            Completing authentication...
          </div>
          <div className="text-sm text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center" data-testid="error-message">
            <h2 className="text-xl font-bold text-red-600">Authentication Failed</h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <p className="mt-4 text-xs text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mb-4 text-lg font-semibold text-gray-900">
              Completing authentication...
            </div>
            <div className="text-sm text-gray-600">Please wait</div>
          </div>
        </div>
      }
    >
      <OAuthCallbackContent />
    </Suspense>
  );
}

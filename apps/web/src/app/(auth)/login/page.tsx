/**
 * Login page.
 * Client component for user authentication.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLogin, apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Button, Input } from '@er/ui-components';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLogin();

  const handleOAuthLogin = async (provider: 'GOOGLE' | 'GITHUB' | 'MICROSOFT') => {
    try {
      const redirectUri = `${window.location.origin}/auth/oauth/callback`;
      const response = await apiClient.getOAuthAuthorizationUrl(provider.toLowerCase(), redirectUri);
      
      // Store redirect URI in sessionStorage for callback
      sessionStorage.setItem('oauth_redirect_uri', redirectUri);
      
      // Redirect to OAuth provider
      window.location.href = response.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initiate OAuth login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await loginMutation.mutateAsync({
        email,
        password,
      });

      // Store tokens
      useAuthStore.getState().setTokens({
        accessToken: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
      });

      // Redirect:
      // - If this user has admin access, route to admin dashboard.
      // - Otherwise, route to user dashboard.
      try {
        await apiClient.get('/admin/dashboard');
        router.push('/admin/dashboard');
      } catch {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            to your Escalating Reminders account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} data-testid="login-form">
          {error && (
            <div className="rounded-md bg-red-50 p-4" data-testid="login-error" role="alert">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                data-testid="email-input"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                data-testid="password-input"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              data-testid="login-button"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              data-testid="oauth-google-button"
              onClick={() => handleOAuthLogin('GOOGLE')}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          <div className="text-center text-sm">
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500" data-testid="register-link">
              Don't have an account? Sign up
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}


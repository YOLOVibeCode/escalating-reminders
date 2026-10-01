/**
 * Home page.
 * Redirects to dashboard if authenticated, otherwise shows landing page.
 */

import Link from 'next/link';
import { Button } from '@er/ui-components';
import { PublicFooter } from '@/components/public-footer';

export default function HomePage(): JSX.Element {
  // For now, show a simple landing page
  // In production, check auth and redirect accordingly
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mx-auto max-w-4xl space-y-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900">Escalating Reminders</h1>
        <p className="text-xl text-gray-600">
          Never miss an important reminder again. Smart escalation ensures you're always notified.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register">
            <Button size="lg" data-testid="home-get-started-button">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" data-testid="home-sign-in-button">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
      </div>
      <PublicFooter />
    </div>
  );
}


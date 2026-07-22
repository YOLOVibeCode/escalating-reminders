import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/components/providers/query-provider';
import { EnvChrome } from '@/lib/env-chrome/EnvChrome';
import { badgeFor } from '@/lib/env-chrome/chrome';
import { resolveServerEnv } from '@/lib/env-chrome/resolve';
import { HOST_RULES } from '@/env-chrome.config';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const BASE_TITLE = 'Escalating Reminders';
const BASE_DESCRIPTION = 'Never miss an important reminder again';

export function generateMetadata(): Metadata {
  const env = resolveServerEnv();
  const badge = badgeFor(env);
  const prefix = badge ? `[${badge.short}] ` : '';
  return {
    title: {
      template: `${prefix}%s`,
      default: `${prefix}${BASE_TITLE}`,
    },
    description: BASE_DESCRIPTION,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const env = resolveServerEnv();
  return (
    <html lang="en">
      <body className={inter.className}>
        <EnvChrome env={env} hostRules={HOST_RULES} />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}


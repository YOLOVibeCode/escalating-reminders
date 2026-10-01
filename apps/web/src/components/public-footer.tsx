import Link from 'next/link';

export function PublicFooter(): JSX.Element {
  return (
    <footer
      className="border-t border-gray-200 bg-white py-6 text-center text-sm text-gray-600"
      data-testid="public-footer"
    >
      <nav className="flex justify-center gap-6" aria-label="Legal">
        <Link href="/privacy" data-testid="link-privacy" className="hover:text-gray-900">
          Privacy Policy
        </Link>
        <Link href="/terms" data-testid="link-terms" className="hover:text-gray-900">
          Terms of Service
        </Link>
      </nav>
      <p className="mt-2">Escalating Reminders</p>
    </footer>
  );
}

import { ContactOptIn } from '@/components/contact-opt-in';
import { PublicFooter } from '@/components/public-footer';

/** Public page a trusted contact opens from the link the user sent them. No login. */
export default function ContactOptInPage({
  params,
}: {
  params: { token: string };
}): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="mx-auto max-w-2xl flex-1 px-6 py-12 text-gray-800">
        <ContactOptIn token={params.token} />
      </main>
      <PublicFooter />
    </div>
  );
}

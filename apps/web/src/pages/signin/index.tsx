import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NavigationBar from '@/components/NavigationBar';
import { signInWithCode } from '@/lib/auth';

/** Where the link in the sign-in email lands: signs you in with the code it carries. */
export default function SignInPage() {
  const router = useRouter();
  const [state, setState] = useState<{ status: 'working' | 'done' | 'failed'; name?: string }>({ status: 'working' });
  const tried = useRef(false);

  useEffect(() => {
    if (!router.isReady || tried.current) return;
    tried.current = true;
    const email = typeof router.query.email === 'string' ? router.query.email : '';
    const code = typeof router.query.code === 'string' ? router.query.code : '';
    if (!email || !code) return setState({ status: 'failed' });
    // Don't leave the code in the address bar or history.
    router.replace('/signin', undefined, { shallow: true });
    signInWithCode(email, code).then(
      (user) => setState({ status: 'done', name: user.username }),
      () => setState({ status: 'failed' }),
    );
  }, [router]);

  return (
    <>
      <Head>
        <title>Sign in · Relay Chess</title>
        <meta name="robots" content="noindex" />
      </Head>
      <NavigationBar />
      <main className="mx-auto max-w-md px-4 py-20 text-center">
        {state.status === 'working' && <p className="text-fg-muted">Signing you in…</p>}
        {state.status === 'done' && (
          <>
            <h1 className="text-2xl font-semibold">You&apos;re signed in</h1>
            <p className="mt-2 text-fg-muted">
              Playing as <span className="font-medium text-fg">{state.name}</span>. That name is yours now.
            </p>
            <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg hover:bg-accent/90">
              Play
            </Link>
          </>
        )}
        {state.status === 'failed' && (
          <>
            <h1 className="text-2xl font-semibold">That link didn&apos;t work</h1>
            <p className="mt-2 text-fg-muted">It may have expired or already been used. Open settings (your name, top right) to get a new code.</p>
            <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg border border-line px-5 text-sm font-medium hover:bg-fg/5">
              Back to Relay Chess
            </Link>
          </>
        )}
      </main>
    </>
  );
}

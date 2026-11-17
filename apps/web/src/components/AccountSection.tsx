import { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppContext } from '@/contexts/App';
import SocialsForm from '@/components/SocialsForm';
import { useUser } from '@/hooks/useUser';
import { sendSignInCode, signInWithCode, signOut } from '@/lib/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorText: Record<string, string> = {
  'rate-limited': 'Too many tries. Wait a minute and try again.',
  'bad-code': "That code didn't work. Check it or send a new one.",
  'send-failed': "Couldn't send the code. Try again.",
};

/**
 * Optional account: sign in with a code sent by email. Keeps your name
 * reserved and your player the same on every device. No passwords.
 */
const AccountSection = () => {
  const user = useUser();
  const router = useRouter();
  const { setRightDrawerOpen } = useContext(AppContext);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const signedIn = user.data?.email;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(errorText[(e as Error).message] ?? errorText['send-failed']!);
    } finally {
      setBusy(false);
    }
  };

  if (signedIn) {
    return (
      <section aria-labelledby="account-title">
        <h3 id="account-title" className="text-sm font-semibold">Account</h3>
        <p className="mt-1 text-sm text-fg-muted">
          Signed in as <span className="font-medium text-fg">{signedIn}</span>. Your name is yours on every device.
        </p>
        <div className="mt-3 flex gap-2">
        <Link
          href={`/players/${user.data!._id}`}
          onClick={() => setRightDrawerOpen(false)}
          className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90"
        >
          Your profile
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(async () => {
            await signOut();
            setStep('email');
            setCode('');
          })}
          className="h-10 rounded-lg border border-line px-4 text-sm font-medium hover:bg-fg/5 disabled:opacity-50"
        >
          {busy ? 'Signing out' : 'Sign out'}
        </button>
        </div>
        <div className="mt-6">
          <SocialsForm playerId={user.data!._id} />
        </div>
      </section>
    );
  }

  const cleanEmail = email.trim();
  const cleanCode = code.replace(/\D/g, '');

  return (
    <section aria-labelledby="account-title">
      <h3 id="account-title" className="text-sm font-semibold">Sign in</h3>
      <p className="mt-1 text-sm text-fg-muted">Optional. Keeps your name reserved and the same on every device. We email you a code, no password.</p>

      {step === 'email' ? (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!EMAIL.test(cleanEmail)) return setError('Enter a valid email.');
            run(async () => {
              await sendSignInCode(cleanEmail);
              setStep('code');
            });
          }}
        >
          <label htmlFor="signin-email" className="sr-only">Email</label>
          <input
            id="signin-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => (setEmail(e.target.value), setError(''))}
            className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm focus:border-accent focus:outline-none"
          />
          <button type="submit" disabled={busy || !cleanEmail} className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-50">
            {busy ? 'Sending' : 'Send code'}
          </button>
        </form>
      ) : (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (cleanCode.length !== 6) return setError('Enter the 6-digit code.');
            run(async () => {
              await signInWithCode(cleanEmail, cleanCode);
              setRightDrawerOpen(false);
              await router.push('/');
            });
          }}
        >
          <label htmlFor="signin-code" className="text-sm text-fg-muted">
            Code sent to <span className="font-medium text-fg">{cleanEmail}</span>
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="signin-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              autoFocus
              onChange={(e) => (setCode(e.target.value), setError(''))}
              className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 font-mono text-sm tracking-[0.3em] focus:border-accent focus:outline-none"
            />
            <button type="submit" disabled={busy} className="h-10 shrink-0 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg hover:bg-accent/90 disabled:opacity-50">
              {busy ? 'Checking' : 'Sign in'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => (setStep('email'), setCode(''), setError(''))}
            className="mt-2 text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline"
          >
            Use a different email or resend
          </button>
        </form>
      )}
      {error && (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};

export default AccountSection;

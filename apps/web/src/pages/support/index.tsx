import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import { isAxiosError } from 'axios';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import { joinSupporterWaitlist } from '@/apis/auth';

/*
 * Hidden on purpose: noindex, not in the sitemap, not linked from anywhere.
 * Every feature is free. Supporting is a thank-you (like lichess Patron), with
 * a few cosmetic extras. GitHub Sponsors takes monthly or one-time gifts today;
 * the email box is for people who'd rather pay by card once that exists.
 */

const SPONSOR_URL = 'https://github.com/sponsors/msabree';

const FREE = [
  'Play with friends, 1 to 4 a side',
  'Quick match and partner queues',
  'Full game review with Stockfish',
  'Your profile and game history',
  'Partners, live games and leaderboards',
  'No ads, ever',
];

const THANKS = ['Blue check next to your name', 'Extra board colors', 'Supporter arenas', 'Your name on the supporters list'];

const Tick = ({ className = 'text-accent-ink' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mt-0.5 shrink-0 ${className}`} aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

function Notify() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error' | 'invalid' | 'limited'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setState('invalid');
    setState('sending');
    try {
      await joinSupporterWaitlist(email.trim(), website);
      setState('done');
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setState(status === 400 ? 'invalid' : status === 429 ? 'limited' : 'error');
    }
  };

  if (state === 'done') {
    return (
      <p role="status" className="rounded-lg bg-accent-fg/10 px-4 py-3 text-sm font-medium">
        Thanks! We&apos;ll email you when card checkout is ready.
      </p>
    );
  }
  const message = { invalid: 'Enter a valid email.', limited: 'Too many tries. Try again later.', error: 'Something went wrong. Try again.' }[state as string];

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="support-email" className="sr-only">Email</label>
      <div className="flex gap-2">
        <input
          id="support-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => (setEmail(e.target.value), setState('idle'))}
          className="h-11 min-w-0 flex-1 rounded-lg border border-accent-fg/20 bg-accent-fg/5 px-3 text-sm text-accent-fg placeholder:text-accent-fg/50 focus:border-accent-fg/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === 'sending'}
          className="h-11 shrink-0 rounded-lg border border-accent-fg/30 px-4 text-sm font-semibold hover:bg-accent-fg/10 disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending' : 'Notify me'}
        </button>
      </div>
      {/* Bots fill in every field; people never see this one. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="support-website">Website</label>
        <input id="support-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {message && (
        <p role="alert" className="mt-2 text-sm font-medium">
          {message}
        </p>
      )}
    </form>
  );
}

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support Relay Chess</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <NavigationBar />

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-fg-muted">Support Relay Chess</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Free for everyone. Kept going by you.</h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Every feature is free, for everyone, with no ads. If Relay Chess has given you a good game night, chip in to keep the boards
            running. It pays for the servers and the time to build what&apos;s next.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section aria-labelledby="free-title" className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h2 id="free-title" className="text-xl font-semibold">Free for everyone</h2>
            <p className="mt-1 text-sm text-fg-muted">Every feature. No paywall.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <Tick />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="support-title" className="relative flex flex-col rounded-2xl bg-accent p-6 text-accent-fg sm:p-8">
            <h2 id="support-title" className="text-xl font-semibold">Become a supporter</h2>
            <p className="mt-1 text-sm text-accent-fg/75">Any amount, monthly or one time.</p>

            <p className="mt-6 text-sm font-medium">A few thank-yous, coming soon:</p>
            <ul className="mt-3 space-y-3 text-sm">
              {THANKS.map((f) => (
                <li key={f} className="flex gap-2">
                  <Tick className="" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-accent-fg/70">Just for fun. Supporters never get an edge on the board.</p>

            <a
              href={SPONSOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-accent-fg px-5 text-base font-semibold text-accent hover:bg-accent-fg/90"
            >
              Support on GitHub ↗
            </a>

            <div className="mt-6 border-t border-accent-fg/15 pt-5">
              <p className="mb-3 text-sm">No GitHub account? Card checkout is on the way. Get an email when it&apos;s ready.</p>
              <Notify />
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

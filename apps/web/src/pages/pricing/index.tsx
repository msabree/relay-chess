import { useState, type FormEvent } from 'react';
import Head from 'next/head';
import { isAxiosError } from 'axios';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import { joinPlusWaitlist } from '@/apis/auth';

/*
 * Hidden on purpose: noindex, not in the sitemap, not linked from anywhere.
 * Plus isn't live. This page tests demand with a "get notified" list.
 */

const PLUS_PRICE = '$4.99';
const SPONSOR_URL = 'https://github.com/sponsors/msabree';

const FREE = [
  'Play with friends, 1 to 4 a side',
  'Quick match and partner queues',
  'Your profile and last 100 games',
  'Game review with Stockfish',
  'Partners and leaderboards',
];

const PLUS = [
  'Plus badge next to your name',
  'Your full game history, every game',
  'Deeper game review',
  'Board themes',
  'Early access to new features',
];

const Tick = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent-ink" aria-hidden="true">
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
      await joinPlusWaitlist(email.trim(), website);
      setState('done');
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setState(status === 400 ? 'invalid' : status === 429 ? 'limited' : 'error');
    }
  };

  if (state === 'done') {
    return (
      <p role="status" className="rounded-lg bg-accent-fg/10 px-4 py-3 text-sm font-medium">
        You&apos;re on the list. We&apos;ll email you when Plus launches.
      </p>
    );
  }
  const message = { invalid: 'Enter a valid email.', limited: 'Too many tries. Try again later.', error: 'Something went wrong. Try again.' }[state as string];

  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor="plus-email" className="sr-only">Email</label>
      <div className="flex gap-2">
        <input
          id="plus-email"
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
          className="h-11 shrink-0 rounded-lg bg-accent-fg px-4 text-sm font-semibold text-accent hover:bg-accent-fg/90 disabled:opacity-60"
        >
          {state === 'sending' ? 'Sending' : 'Get notified'}
        </button>
      </div>
      {/* Bots fill in every field; people never see this one. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="plus-website">Website</label>
        <input id="plus-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      {message && (
        <p role="alert" className="mt-2 text-sm font-medium">
          {message}
        </p>
      )}
    </form>
  );
}

export default function PricingPage() {
  return (
    <>
      <Head>
        <title>Relay Chess Plus</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <NavigationBar />

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-fg-muted">Relay Chess Plus</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Playing is free. Plus is extra.</h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Every game mode stays free for everyone. Plus is for players who want a little more, and it keeps the boards running.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          <section aria-labelledby="free-title" className="flex flex-col rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h2 id="free-title" className="text-xl font-semibold">Free</h2>
            <p className="mt-3">
              <span className="text-4xl font-semibold tracking-tight">$0</span>
              <span className="ml-1 text-fg-muted">forever</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {FREE.map((f) => (
                <li key={f} className="flex gap-2">
                  <Tick />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="plus-title" className="relative flex flex-col rounded-2xl bg-accent p-6 text-accent-fg sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 id="plus-title" className="text-xl font-semibold">Plus</h2>
              <span className="rounded-full bg-accent-fg px-3 py-1 text-xs font-semibold text-accent">Coming soon</span>
            </div>
            <p className="mt-3">
              <span className="text-4xl font-semibold tracking-tight">{PLUS_PRICE}</span>
              <span className="ml-1 text-accent-fg/70">/ month</span>
            </p>
            <p className="mt-6 text-sm font-medium">Everything in Free, plus:</p>
            <ul className="mt-3 space-y-3 text-sm">
              {PLUS.map((f) => (
                <li key={f} className="flex gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-accent-fg/15 pt-6">
              <p className="mb-3 text-sm font-medium">Want it? Get an email when it launches.</p>
              <Notify />
            </div>
          </section>
        </div>

        <section aria-labelledby="sponsor-title" className="mt-4 flex flex-col gap-4 rounded-2xl border border-line p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 id="sponsor-title" className="text-lg font-semibold">Rather back the project?</h2>
            <p className="mt-1 text-sm text-fg-muted">Relay Chess is open source. Sponsors keep it running and get listed as supporters.</p>
          </div>
          <a
            href={SPONSOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line px-5 text-sm font-semibold hover:bg-fg/5"
          >
            Become a sponsor ↗
          </a>
        </section>
      </main>

      <Footer />
    </>
  );
}

import { useContext, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import { isAxiosError } from 'axios';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import VerifiedMark from '@/components/VerifiedMark';
import SupporterControls from '@/components/SupporterControls';
import { AppContext } from '@/contexts/App';
import { useUser } from '@/hooks/useUser';
import { useSupport } from '@/hooks/useSupport';
import { getSupporters, startCheckout, type Plan } from '@/apis/support';

/*
 * Hidden on purpose: noindex, not in the sitemap, not linked from anywhere.
 * Every feature is free. Supporting is a thank-you (like lichess Patron), with
 * a few cosmetic extras. Stripe handles the payments; signed-in players only.
 */

/** Must match the Stripe prices (STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY). */
const PLANS: { value: Plan; price: string; per: string; note?: string }[] = [
  { value: 'monthly', price: '$3.99', per: 'month' },
  { value: 'yearly', price: '$39.99', per: 'year', note: '2 months free' },
];

const FREE = [
  'Play with friends, 1 to 4 a side',
  'Quick match and partner queues',
  'Full game review with Stockfish',
  'Your profile and game history',
  'Partners, live games and leaderboards',
  'No ads, ever',
];

const THANKS = ['Blue check next to your name', 'Extra board colors', 'Supporter arenas: a look for your games', 'Your name on the supporters list (if you like)'];

const Tick = ({ className = 'text-accent-ink' }: { className?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`mt-0.5 shrink-0 ${className}`} aria-hidden="true">
    <path d="M5 12l5 5L20 7" />
  </svg>
);

/** Pick a plan and go to Stripe Checkout. Guests sign in first. */
function Join({ signedIn }: { signedIn: boolean }) {
  const { setRightDrawerOpen } = useContext(AppContext);
  const [plan, setPlan] = useState<Plan>('monthly');
  const [state, setState] = useState<'idle' | 'going' | 'error' | 'already'>('idle');

  const go = async () => {
    if (!signedIn) return setRightDrawerOpen(true);
    setState('going');
    try {
      window.location.assign(await startCheckout(plan));
    } catch (e) {
      setState(isAxiosError(e) && e.response?.status === 409 ? 'already' : 'error');
    }
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Plan" className="grid grid-cols-2 gap-2">
        {PLANS.map((p) => {
          const on = plan === p.value;
          return (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => (setPlan(p.value), setState('idle'))}
              className={`rounded-xl border-2 p-3 text-left ${on ? 'border-accent-fg bg-accent-fg/10' : 'border-accent-fg/20 hover:border-accent-fg/50'}`}
            >
              <span className="block text-2xl font-semibold leading-tight">{p.price}</span>
              <span className="block text-sm text-accent-fg/75">a {p.per}</span>
              {p.note && <span className="mt-1 block text-xs font-semibold">{p.note}</span>}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={go}
        disabled={state === 'going'}
        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent-fg px-5 text-base font-semibold text-accent hover:bg-accent-fg/90 disabled:opacity-70"
      >
        {!signedIn ? 'Sign in to become a supporter' : state === 'going' ? 'Opening checkout…' : 'Continue to checkout'}
      </button>
      <p className="mt-2 text-xs text-accent-fg/70">
        {signedIn ? 'Secure checkout by Stripe. Cancel any time.' : 'Supporting is tied to your account, so your perks follow you everywhere.'}
      </p>
      {(state === 'error' || state === 'already') && (
        <p role="alert" className="mt-2 text-sm font-medium">
          {state === 'already' ? "You're already a supporter. Thank you!" : "Couldn't open checkout. Try again."}
        </p>
      )}
    </div>
  );
}

function Wall() {
  const list = useQuery('supporters', getSupporters, { staleTime: 60_000, refetchOnWindowFocus: false });
  return (
    <section aria-labelledby="wall-title" className="mt-16">
      <h2 id="wall-title" className="text-2xl font-semibold tracking-tight">Supporters</h2>
      <p className="mt-1 text-sm text-fg-muted">The people keeping the boards running. Supporters choose whether to be listed.</p>
      {list.data?.length ? (
        <ul className="mt-6 flex flex-wrap gap-2">
          {list.data.map((s) => (
            <li key={s.id}>
              <Link href={`/players/${s.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium hover:bg-raised">
                {s.username}
                <VerifiedMark size={12} supporter />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-fg-subtle">{list.isLoading ? 'Loading…' : 'Nobody here yet. You could be the first.'}</p>
      )}
    </section>
  );
}

export default function SupportPage() {
  const router = useRouter();
  const user = useUser();
  const support = useSupport();
  const signedIn = !!user.data?.verified;
  const m = support.data?.membership;
  const thanks = router.query.thanks === '1';

  // Back from Stripe: the webhook can be a few seconds behind. Check again until it lands.
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (!thanks || m?.active || tries >= 15 || !support.data) return;
    const t = setTimeout(() => (setTries((n) => n + 1), void support.refetch()), 2000);
    return () => clearTimeout(t);
  }, [thanks, m?.active, tries, support]);

  let card;
  if (support.isLoading || user.isLoading) {
    card = <p className="text-sm text-accent-fg/75">Loading…</p>;
  } else if (m?.active) {
    card = (
      <div className="rounded-xl bg-surface p-4 text-fg">
        <p className="flex items-center gap-2 font-semibold">
          <VerifiedMark size={18} supporter decorative /> You&apos;re a supporter. Thank you!
        </p>
        <div className="mt-3">
          <SupporterControls membership={m} />
        </div>
        <p className="mt-3 text-xs text-fg-subtle">Board colors and arenas are in Settings.</p>
      </div>
    );
  } else if (thanks && signedIn) {
    card = (
      <p role="status" className="rounded-lg bg-accent-fg/10 px-4 py-3 text-sm font-medium">
        {tries >= 15 ? 'Thanks! Your payment is still on its way. Refresh in a minute, or check your email for the receipt.' : 'Thanks! Setting up your perks…'}
      </p>
    );
  } else if (support.data && !support.data.enabled) {
    card = <p className="rounded-lg bg-accent-fg/10 px-4 py-3 text-sm font-medium">Supporting opens soon. Check back in a bit.</p>;
  } else {
    card = (
      <>
        {m && !m.active && <p className="mb-4 text-sm font-medium">Welcome back. Pick a plan to bring your perks back.</p>}
        <Join signedIn={signedIn} />
      </>
    );
  }

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
            Every feature is free, for everyone, with no ads. If Relay Chess has given you a good game night, become a supporter to keep
            the boards running. It pays for the servers and the time to build what&apos;s next.
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
            <h2 id="support-title" className="text-xl font-semibold">Relay Supporters</h2>
            <p className="mt-1 text-sm text-accent-fg/75">A few thank-yous, just for fun:</p>
            <ul className="mt-4 space-y-3 text-sm">
              {THANKS.map((f) => (
                <li key={f} className="flex gap-2">
                  <Tick className="" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-accent-fg/70">Supporters never get an edge on the board.</p>
            <div className="mt-6">{card}</div>
          </section>
        </div>

        <Wall />

        <p className="mt-16 max-w-2xl text-xs leading-relaxed text-fg-subtle">
          Supporter payments are contributions to keep Relay Chess running. They aren&apos;t tax-deductible donations. Payments are handled by
          Stripe; we never see your card. Cancel any time from Settings and your perks last until the end of the period you paid for.
        </p>
      </main>

      <Footer />
    </>
  );
}

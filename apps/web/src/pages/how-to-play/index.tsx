import { useContext } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import CreatePrivateGame from '@/modals/CreatePrivateGame';
import { AppContext } from '@/contexts/App';
import { OG_IMAGE, SITE_URL } from '@/constants';

const URL = `${SITE_URL}/how-to-play`;
const TITLE = 'How to play team chess (2v2 relay chess) | Relay Chess';
const DESCRIPTION =
  'The rules of team chess: two teams share one board and teammates take turns making moves. How turns, clocks, draws and chat work, plus tips for playing 2v2 chess with a partner.';

const RULES = [
  {
    title: 'Two teams, one board',
    body: 'White and Black are teams of 1 to 4 players each. Two per side is the classic setup, but 2v1, 3v3 and 4v4 all work.',
  },
  {
    title: 'Teammates take turns',
    body: `Your team's moves rotate through its players in seat order. If you sit first on White, you play White's first move, your partner plays the next one, and so on. The game shows who is moving now and who is up next.`,
  },
  {
    title: 'No huddles',
    body: 'You never get to discuss a plan with your partner. Room chat is visible to everyone, the other team included. You only learn what your partner is thinking from the moves they make.',
  },
  {
    title: 'Normal chess otherwise',
    body: 'Every standard chess rule applies: legal moves only, checkmate wins, and stalemate, repetition, insufficient material and the 50-move rule are draws.',
  },
  {
    title: 'One clock per team',
    body: `Timed games give each team one clock, like a normal game. The clock starts once both sides have moved, and the increment is added after every move. Untimed games are available too.`,
  },
  {
    title: 'Resigning, draws and leaving',
    body: 'Any player can resign or offer a draw for their team, and any player on the other team can accept. Either side can abort before both have moved. If a player drops out, their turns pass to their teammates. If a whole team leaves mid-game, it forfeits after 3 minutes.',
  },
];

const TIPS = [
  {
    title: 'Play simple, readable moves',
    body: `Your partner can't ask what you meant. Moves with an obvious idea, like developing a piece or taking a free pawn, are easier to follow up than a deep trap.`,
  },
  {
    title: `Don't set up a combination you can't finish`,
    body: 'Remember that your next move is not your own. A sacrifice that needs three precise follow-ups depends on your partner finding them.',
  },
  {
    title: 'Look at what your partner just did',
    body: 'Before moving, ask why your partner played their last move. Supporting their idea usually beats starting your own.',
  },
  {
    title: 'Queue your move when you are next',
    body: `When you are up next for your team, you can set your move in advance and it plays as soon as it's your turn. It saves time on the clock.`,
  },
  {
    title: 'Hold the line under pressure',
    body: 'Defending is easier to coordinate than attacking. When in doubt, fix the weakest square on your side of the board.',
  },
];

const FAQ = [
  {
    q: 'What is team chess?',
    a: 'Team chess is chess played by teams instead of individuals. In relay chess, the version played on Relay Chess, both teams share one board and teammates take turns making their side’s moves without talking about them.',
  },
  {
    q: 'Can I play 2v2 chess online for free?',
    a: 'Yes. Relay Chess is free, has no ads and needs no account. Create a room, share the link with three friends and pick sides, or join the public queue to play with strangers.',
  },
  {
    q: 'How is this different from bughouse?',
    a: 'Bughouse uses two boards: you play your own opponent and pass captured pieces to your partner. Relay chess uses a single board, and you and your partner play the same position by alternating moves.',
  },
  {
    q: 'How is this different from 4-player chess?',
    a: 'Four-player chess uses a larger cross-shaped board where four armies play at once. Relay chess keeps the normal board and normal rules; only the players on each side change.',
  },
  {
    q: 'How many people can play?',
    a: 'Each team can have 1 to 4 players, so a room holds 2 to 8 players. Anyone else who opens the link can watch.',
  },
  {
    q: 'Can my partner and I talk during the game?',
    a: 'Room chat is open to everyone, including the other team, so there is no private team chat. Part of the fun is reading your partner from their moves alone.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};

export default function HowToPlay() {
  const { setModal, modal } = useContext(AppContext);
  const start = (
    <button
      type="button"
      onClick={() => setModal({ name: 'CREATING_PRIVATE_GAME' })}
      className="h-12 rounded-xl bg-accent px-6 text-base font-semibold text-accent-fg transition-colors hover:bg-accent/90"
    >
      Start a game with friends
    </button>
  );

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={URL} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={URL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:site_name" content="Relay Chess" />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      <NavigationBar />

      <main className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <p className="text-sm font-medium text-fg-muted">Rules and tips</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">How to play team chess</h1>
        <p className="mt-5 text-lg leading-relaxed text-fg-muted">
          Team chess on Relay Chess is <strong className="font-semibold text-fg">relay chess</strong>: two teams share one
          board, and teammates take turns making their side&apos;s moves without talking about them. It plays like normal
          chess, except your next move might come from a partner who sees the position very differently.
        </p>
        <div className="mt-8">{start}</div>

        <section className="mt-16" aria-labelledby="rules">
          <h2 id="rules" className="text-2xl font-semibold tracking-tight sm:text-3xl">The rules</h2>
          <ol className="mt-6 space-y-6">
            {RULES.map((r, i) => (
              <li key={r.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-sm font-semibold text-accent-fg">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{r.title}</h3>
                  <p className="mt-1 leading-relaxed text-fg-muted">{r.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16" aria-labelledby="start">
          <h2 id="start" className="text-2xl font-semibold tracking-tight sm:text-3xl">Starting a game</h2>
          <ul className="mt-6 space-y-4 leading-relaxed text-fg-muted">
            <li>
              <strong className="font-semibold text-fg">With friends:</strong> create a private room, send the link to your
              group and pick sides. Choose a clock, and White&apos;s first move starts the game.
            </li>
            <li>
              <strong className="font-semibold text-fg">With strangers:</strong> pick a time control on the{' '}
              <Link href="/#play" className="text-fg underline underline-offset-4">home page</Link> and you are matched into a
              2v2 game when four players are ready. Bring a friend as a party to play on the same team.
            </li>
            <li>
              <strong className="font-semibold text-fg">Just watching:</strong> open any game link, or browse{' '}
              <Link href="/live-games" className="text-fg underline underline-offset-4">live games</Link>.
            </li>
          </ul>
        </section>

        <section className="mt-16" aria-labelledby="tips">
          <h2 id="tips" className="text-2xl font-semibold tracking-tight sm:text-3xl">Tips for playing with a partner</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {TIPS.map((t) => (
              <div key={t.title} className="rounded-2xl border border-line p-5">
                <h3 className="font-semibold">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="faq">
          <h2 id="faq" className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold marker:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span aria-hidden="true" className="text-fg-subtle transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 leading-relaxed text-fg-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl bg-surface p-8 text-center ring-1 ring-inset ring-line">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to try it?</h2>
          <p className="mx-auto mt-2 max-w-md text-fg-muted">Free, no ads, no account. Share one link and you are playing.</p>
          <div className="mt-6">{start}</div>
        </section>
      </main>

      <Footer />
      <CreatePrivateGame open={modal.name === 'CREATING_PRIVATE_GAME'} onClose={() => setModal({ name: '' })} />
    </>
  );
}

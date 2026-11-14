import Head from 'next/head';
import Link from 'next/link';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import ContactUsForm from '@/components/ContactUsForm';
import useGamesPlayed from '@/hooks/useGamesPlayed';
import { SITE_URL } from '@/constants';
import { REPO_URL, issueUrl } from '@/lib/github';

const FACTS = [
  { title: 'Free, no ads', body: 'No ads, no paywall, no premium tier. Every game mode is free.' },
  { title: 'Open source', body: 'The whole site is MIT licensed on GitHub. Anyone can read it, run it or improve it.' },
  { title: 'No account needed', body: 'You get a random nickname and play right away. Share a link and your friends are in.' },
];

const HELP = [
  { label: 'Play and share it', body: 'Start a game and send the link to your group chat.', href: '/', external: false },
  { label: 'Report a bug', body: 'Something broken? Open an issue on GitHub.', href: issueUrl('bug_report'), external: true },
  { label: 'Suggest a feature', body: 'Ideas for the game are always welcome.', href: issueUrl('feature_request'), external: true },
  { label: 'Contribute code', body: 'Pick up an issue or improve the docs.', href: REPO_URL, external: true },
];

export default function AboutPage() {
  const gamesPlayed = useGamesPlayed();

  return (
    <>
      <Head>
        <title>About Relay Chess: free, open source 2v2 team chess</title>
        <meta
          name="description"
          content="Relay Chess started at game night with four friends and one board. It is free, open source 2v2 team chess with no ads and no accounts. Get in touch or help build it."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`${SITE_URL}/about`} />
      </Head>

      <NavigationBar />

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* About */}
          <div>
            <p className="text-sm font-medium text-fg-muted">About</p>
            <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Born at game night.</h1>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-fg-muted">
              <p>
                Relay Chess started with four friends, one board, and a lot of groaning at a partner&apos;s
                &ldquo;creative&rdquo; moves. Two teams, one board, teammates taking turns, and nobody allowed to explain
                their plan.
              </p>
              <p>
                We built it so game night works from anywhere. It is free, it has no ads, and the code is open, so it
                sticks around for as long as people want to play.
                {gamesPlayed ? (
                  <>
                    {' '}
                    So far that&apos;s{' '}
                    <span className="rounded-md bg-accent px-1.5 font-semibold tabular-nums text-accent-fg">
                      {gamesPlayed.toLocaleString('en-US')}
                    </span>{' '}
                    games.
                  </>
                ) : null}
              </p>
            </div>

            <dl className="mt-10 grid gap-6 sm:grid-cols-3">
              {FACTS.map((f) => (
                <div key={f.title} className="border-t border-line pt-4">
                  <dt className="font-semibold">{f.title}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-fg-muted">{f.body}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-14 text-xl font-semibold tracking-tight">Help out</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {HELP.map((h) => (
                <li key={h.label}>
                  <Link
                    href={h.href}
                    {...(h.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group flex items-center justify-between gap-4 py-4"
                  >
                    <span>
                      <span className="block font-medium group-hover:underline group-hover:underline-offset-4">{h.label}</span>
                      <span className="block text-sm text-fg-muted">{h.body}</span>
                    </span>
                    <span aria-hidden="true" className="text-fg-subtle transition-transform group-hover:translate-x-0.5">
                      {h.external ? '↗' : '→'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-fg-subtle">
              New to the game? Read <Link href="/how-to-play" className="underline underline-offset-4 hover:text-fg">how to play team chess</Link>.
            </p>
          </div>

          {/* Contact */}
          <section id="contact" aria-labelledby="contact-title" className="lg:pt-8">
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:sticky lg:top-24">
              <h2 id="contact-title" className="text-2xl font-semibold tracking-tight">Get in touch</h2>
              <p className="mt-2 text-fg-muted">Partnerships, press, clubs and schools, or just saying hi. We read everything.</p>
              <div className="mt-6">
                <ContactUsForm />
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}

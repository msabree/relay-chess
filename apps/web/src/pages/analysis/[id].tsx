import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import ClientPage from './ClientPage';
import { SERVER_URL } from '@/constants';
import { describeResult } from '@/lib/result';

interface Props {
  title: string;
  description: string;
  url: string;
  image: string;
}

/** Server-rendered so links shared to social apps get a title and preview image. */
export default function AnalysisPage({ title, description, url, image }: Props) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Relay Chess" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </Head>
      <ClientPage />
    </>
  );
}

type Record = {
  reason: string;
  winningColor: 'white' | 'black' | null;
  whiteTeam?: { name: string }[];
  blackTeam?: { name: string }[];
  gameHistory?: unknown[];
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
  const id = String(params?.id ?? '');
  // Use the host we were reached on so staging previews point at staging.
  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0] ?? 'https';
  const origin = `${proto}://${req.headers.host}`;

  let title = 'Game review · Relay Chess';
  let description = 'A 2v2 game on Relay Chess. Replay every move and see the computer analysis.';
  try {
    const res = await fetch(`${SERVER_URL}/games/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const { game } = (await res.json()) as { game: Record };
      const winner = game.winningColor === 'white' ? 'w' : game.winningColor === 'black' ? 'b' : null;
      const r = describeResult(winner, game.reason);
      const moves = Math.ceil((game.gameHistory?.length ?? 0) / 2);
      const team = (t?: { name: string }[]) => (t?.length ? t.map((p) => p.name).join(' & ') : 'Anonymous');
      title = `${r.title}${r.detail ? ` ${r.detail}` : ''} · Relay Chess`;
      description = `${team(game.whiteTeam)} vs ${team(game.blackTeam)}, ${moves} moves. Replay the game on Relay Chess.`;
    }
  } catch {
    // Preview falls back to generic text; the page itself loads the game client-side.
  }

  return {
    props: { title, description, url: `${origin}/analysis/${id}`, image: `${origin}/api/og/${encodeURIComponent(id)}` },
  };
};

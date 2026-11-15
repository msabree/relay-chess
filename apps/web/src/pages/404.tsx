import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import { useBoardColor } from '@/lib/settings';

/** Sixteen kings a side: a position that can't exist, like this page. */
const START = 'kkkkkkkk/kkkkkkkk/8/8/8/8/KKKKKKKK/KKKKKKKK';

type Position = Record<string, { pieceType: string }>;

function fromFen(fen: string): Position {
  const out: Position = {};
  fen.split('/').forEach((row, r) => {
    let c = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) c += Number(ch);
      else {
        out[`${'abcdefgh'[c]}${8 - r}`] = { pieceType: (ch === ch.toUpperCase() ? 'w' : 'b') + 'K' };
        c++;
      }
    }
  });
  return out;
}

export default function NotFound() {
  const scheme = useBoardColor();
  const [position, setPosition] = useState<Position>(() => fromFen(START));
  const [moved, setMoved] = useState(false);

  return (
    <>
      <Head>
        <title>Page not found · Relay Chess</title>
        <meta name="robots" content="noindex" />
      </Head>
      <NavigationBar />
      <main className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1fr_1fr] md:py-24">
        <div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">This page isn&apos;t on the board.</h1>
          <p className="mt-4 max-w-md text-lg text-fg-muted">
            Thirty-two kings can&apos;t exist, and neither can this page. Push them around while you&apos;re here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-fg hover:bg-accent/90">
              Play a real game
            </Link>
            <Link href="/live-games" className="inline-flex h-11 items-center rounded-lg border border-line px-5 text-sm font-medium hover:bg-fg/5">
              Watch live games
            </Link>
          </div>
          <p className="mt-6 text-sm text-fg-subtle">
            Followed a broken link on our site?{' '}
            <Link href="/about#contact" className="underline underline-offset-4 hover:text-fg">
              Let us know
            </Link>
            .
          </p>
        </div>

        <div className="mx-auto w-full max-w-[440px]">
          <Chessboard
            options={{
              id: 'not-found',
              position,
              darkSquareStyle: { backgroundColor: scheme.dark },
              lightSquareStyle: { backgroundColor: scheme.light },
              boardStyle: { borderRadius: 8, overflow: 'hidden' },
              onPieceDrop: ({ sourceSquare, targetSquare }) => {
                if (!targetSquare || targetSquare === sourceSquare) return false;
                setMoved(true);
                setPosition((p) => {
                  const next = { ...p, [targetSquare]: p[sourceSquare]! };
                  delete next[sourceSquare];
                  return next;
                });
                return true;
              },
            }}
          />
          {moved && (
            <div className="mt-3 flex justify-end text-sm">
              <button
                type="button"
                onClick={() => (setPosition(fromFen(START)), setMoved(false))}
                className="font-medium text-fg underline-offset-4 hover:underline"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

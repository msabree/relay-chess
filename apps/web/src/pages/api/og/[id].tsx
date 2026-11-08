import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';
import { SERVER_URL } from '@/constants';
import { describeResult } from '@/lib/result';
import { PIECE_SVGS } from '@/lib/pieceSvgs';

/** Share preview for a finished game: final position, teams and result. 1200x630. */
export const config = { runtime: 'edge' };

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const DARK = '#7E95A3';
const LIGHT = '#DCE1E4';
const YELLOW = '#FFC800';
const SQ = 66;

type Record = {
  reason: string;
  winningColor: 'white' | 'black' | null;
  whiteTeam?: { name: string }[];
  blackTeam?: { name: string }[];
  gameHistory?: { fen: string }[];
};

const pieceSrc = (code: string) =>
  `data:image/svg+xml;base64,${btoa(PIECE_SVGS[code]!.replace('width="100%" height="100%"', `width="${SQ}" height="${SQ}"`))}`;

/** 8 rows of 8: piece code like "wK" or null. */
function parseBoard(fen: string): (string | null)[][] {
  return fen.split(' ')[0]!.split('/').map((row) => {
    const out: (string | null)[] = [];
    for (const ch of row) {
      if (/\d/.test(ch)) for (let i = 0; i < Number(ch); i++) out.push(null);
      else out.push((ch === ch.toUpperCase() ? 'w' : 'b') + ch.toUpperCase());
    }
    return out;
  });
}

const names = (team?: { name: string }[]) => (team?.length ? team.map((p) => p.name).join(', ') : 'Anonymous');

async function loadGame(id: string): Promise<Record | null> {
  try {
    const res = await fetch(`${SERVER_URL}/games/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return ((await res.json()) as { game: Record }).game;
  } catch {
    return null;
  }
}

export default async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id') ?? url.pathname.split('/').pop() ?? '';
  const game = id ? await loadGame(id) : null;

  const winner = game?.winningColor === 'white' ? 'w' : game?.winningColor === 'black' ? 'b' : null;
  const result = game ? describeResult(winner, game.reason) : { title: '2v2 chess with friends', detail: '' };
  const plies = game?.gameHistory?.length ?? 0;
  const fen = game?.gameHistory?.[plies - 1]?.fen ?? START;
  const board = parseBoard(fen);
  const moves = Math.ceil(plies / 2);

  const team = (label: string, dot: string, list: string, won: boolean) => (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 22, color: '#9a9a9a' }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: dot, border: '2px solid #555', marginRight: 10 }} />
        {label}
        {won ? <span style={{ marginLeft: 10, color: YELLOW }}>won</span> : null}
      </div>
      <div style={{ fontSize: 32, color: '#f5f5f5', marginTop: 6, maxWidth: 480 }}>{list}</div>
    </div>
  );

  const image = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#111111', padding: 49 }}>
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden' }}>
          {board.map((row, r) => (
            <div key={r} style={{ display: 'flex' }}>
              {row.map((p, c) => (
                <div
                  key={c}
                  style={{ width: SQ, height: SQ, display: 'flex', background: (r + c) % 2 ? DARK : LIGHT }}
                >
                  {p ? <img src={pieceSrc(p)} width={SQ} height={SQ} alt="" /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 56, flex: 1, height: SQ * 8 }}>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: YELLOW, letterSpacing: 4 }}>RELAY CHESS</div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, color: '#ffffff', marginTop: 18, lineHeight: 1.05 }}>
            {result.title}
          </div>
          {game ? (
            <div style={{ display: 'flex', fontSize: 30, color: '#bdbdbd', marginTop: 10 }}>
              {[result.detail, moves ? `${moves} moves` : ''].filter(Boolean).join(' · ')}
            </div>
          ) : null}
          {game ? team('White', '#f5f5f5', names(game.whiteTeam), winner === 'w') : null}
          {game ? team('Black', '#222222', names(game.blackTeam), winner === 'b') : null}
          <div style={{ display: 'flex', fontSize: 22, color: '#8a8a8a', marginTop: 'auto' }}>relaychess.com · free and open source</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );

  // Finished games never change. Missing ones might just not be saved yet.
  image.headers.set('Cache-Control', game ? 'public, max-age=86400, s-maxage=31536000, immutable' : 'public, max-age=60');
  return image;
}

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChessGameContext } from '@/contexts/ChessGame';
import { resultText } from './util';

const btn = 'h-11 flex-1 rounded-lg border border-line text-sm font-medium hover:bg-fg/5 disabled:opacity-50 transition-colors';

/** Result card after the game; draw/resign/abort during it. */
const GameActions = () => {
  const { game, room, teamColor, abortGame, resignGame, offerDraw, offerRematch, drawOfferedBy, roomId } = useContext(ChessGameContext);
  const [confirmResign, setConfirmResign] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!confirmResign) return;
    const t = setTimeout(() => setConfirmResign(false), 3000);
    return () => clearTimeout(t);
  }, [confirmResign]);

  if (!game) return null;

  if (game.status === 'over') {
    const r = resultText(game);
    const rematchId = room?.rematchRoomId;
    return (
      <div className="space-y-3 p-3">
        <div className="rounded-xl bg-raised px-4 py-3 text-center">
          <p className="text-lg font-semibold">{r.title}</p>
          <p className="text-sm text-fg-muted">{r.detail}</p>
        </div>
        <div className="flex gap-2">
          {rematchId ? (
            <Link href={`/games/${rematchId}`} className="flex h-11 flex-1 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-accent-fg hover:bg-accent/90">
              Join rematch
            </Link>
          ) : teamColor ? (
            <button type="button" onClick={offerRematch} className="h-11 flex-1 rounded-lg bg-accent text-sm font-semibold text-accent-fg hover:bg-accent/90">
              Rematch
            </button>
          ) : null}
          {game.result?.reason !== 'aborted' && game.moves.length > 0 && (
            <Link href={`/analysis/${roomId}`} className={`${btn} flex items-center justify-center`}>
              Review game
            </Link>
          )}
        </div>
        <Link href="/" className="block text-center text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
          Back to the lobby
        </Link>
      </div>
    );
  }

  if (!teamColor) {
    return (
      <div className="flex gap-2 p-3">
        <button
          type="button"
          className={btn}
          onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => (setCopied(true), setTimeout(() => setCopied(false), 2000)))}
        >
          {copied ? 'Link copied' : 'Share this game'}
        </button>
      </div>
    );
  }

  if (game.status === 'waiting') return null;

  if (game.moves.length < 2) {
    return (
      <div className="flex gap-2 p-3">
        <button type="button" onClick={abortGame} className={btn}>
          Abort game
        </button>
      </div>
    );
  }

  const theyOffered = drawOfferedBy && drawOfferedBy !== teamColor;
  const weOffered = drawOfferedBy === teamColor;
  return (
    <div className="flex gap-2 p-3">
      <button
        type="button"
        onClick={offerDraw}
        disabled={weOffered}
        className={theyOffered ? 'h-11 flex-1 rounded-lg bg-accent text-sm font-semibold text-accent-fg hover:bg-accent/90' : btn}
      >
        {theyOffered ? 'Accept draw' : weOffered ? 'Draw offered' : 'Offer draw'}
      </button>
      <button
        type="button"
        onClick={() => (confirmResign ? (setConfirmResign(false), resignGame()) : setConfirmResign(true))}
        className={`${btn} ${confirmResign ? 'border-danger bg-danger/10 font-semibold text-danger' : 'text-danger'}`}
      >
        {confirmResign ? 'Tap again to resign' : 'Resign'}
      </button>
    </div>
  );
};

export default GameActions;

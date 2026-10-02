import { useContext, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChessGameContext } from '@/contexts/ChessGame';
import ChessGame from '@/components/ChessGame';
import { notifyMove } from '@/utils/notifications';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import TeamBar from './TeamBar';
import MoveList from './MoveList';
import RoomChat from './RoomChat';
import RoomSetup from './RoomSetup';
import GameActions from './GameActions';
import { colorName } from './util';

type Tab = 'setup' | 'moves' | 'chat';

/**
 * The game page. Desktop: board with a team bar above and below, and a side
 * panel (setup or moves, chat, actions). Mobile: everything stacked, with
 * tabs under the board.
 */
const GameScreen = ({ lightColor, darkColor }: { lightColor?: string; darkColor?: string }) => {
  const ctx = useContext(ChessGameContext);
  const desktop = useMediaQuery('(min-width: 1024px)');
  const { game, room, teamColor, isMyMove, moveHistoryFen, setMoveHistoryFen, roomError, drawOfferedBy } = ctx;
  const setup = !!room?.isPrivate && game?.status === 'waiting';
  const [tab, setTab] = useState<Tab>('moves');
  const seenChat = useRef(0);
  const [unread, setUnread] = useState(0);

  // Default tab follows the phase of the game.
  useEffect(() => setTab(setup ? 'setup' : 'moves'), [setup]);

  // Unread chat badge on mobile.
  const chatCount = room?.chat.length ?? 0;
  useEffect(() => {
    if (tab === 'chat') {
      seenChat.current = chatCount;
      setUnread(0);
    } else setUnread(Math.max(0, chatCount - seenChat.current));
  }, [chatCount, tab]);

  // Tell the player when it's their turn, even in another tab.
  useEffect(() => {
    if (!isMyMove) {
      document.title = 'Relay Chess';
      return;
    }
    document.title = 'Your move · Relay Chess';
    notifyMove('Your move', "It's your turn in Relay Chess").catch(() => {});
  }, [isMyMove]);

  if (roomError) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">This room isn&apos;t here anymore</h1>
        <p className="mt-3 text-fg-muted">It may have expired, or the link is off by a character. Start a fresh one, it only takes a second.</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Back to the lobby
        </Link>
      </div>
    );
  }

  const bottom = teamColor ?? 'w';
  const top = bottom === 'w' ? 'b' : 'w';
  const offerNote =
    drawOfferedBy && game?.status === 'playing'
      ? drawOfferedBy === teamColor
        ? 'You offered a draw.'
        : `${colorName(drawOfferedBy)} offers a draw.`
      : '';

  const board = (
    <div className="relative">
      <ChessGame lightColor={lightColor} darkColor={darkColor} />
      {!game && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-bg/70 text-sm text-fg-muted">Connecting…</div>
      )}
    </div>
  );

  const reviewBanner = moveHistoryFen && (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-2 text-sm">
      <span className="text-fg-muted">Looking at an earlier move</span>
      <button type="button" onClick={() => setMoveHistoryFen('')} className="font-semibold text-accent-ink hover:underline">
        Back to live
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      {desktop ? (
      <div className="mx-auto flex max-w-[1400px] justify-center gap-6 px-6 py-5">
        <section aria-label="Board" className="flex flex-col gap-2" style={{ width: 'min(100%, calc(100dvh - 56px - 40px - 152px))', minWidth: 420 }}>
          <TeamBar color={top} />
          {board}
          <TeamBar color={bottom} />
        </section>
        <aside
          aria-label="Game panel"
          className="flex w-[360px] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface"
          style={{ height: 'calc(100dvh - 56px - 40px)', maxHeight: 900 }}
        >
          {setup ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <RoomSetup />
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between px-4 pb-1 pt-3">
                <h2 className="text-sm font-semibold">Moves</h2>
                <span className="text-xs text-fg-subtle">initials show who played it</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <MoveList />
              </div>
              {(reviewBanner || offerNote) && (
                <div className="space-y-2 px-3 pb-2">
                  {reviewBanner}
                  {offerNote && <p className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium">{offerNote}</p>}
                </div>
              )}
            </>
          )}
          <div className="border-t border-line">
            <GameActions />
          </div>
          <div className={`flex shrink-0 flex-col border-t border-line ${setup ? 'h-[220px]' : 'h-[300px]'}`}>
            <div className="flex items-baseline justify-between px-4 pt-3">
              <h2 className="text-sm font-semibold">Room chat</h2>
              <span className="text-xs text-fg-subtle">everyone can read this</span>
            </div>
            <div className="min-h-0 flex-1">
              <RoomChat />
            </div>
          </div>
        </aside>
      </div>

      ) : (
      /* Mobile and tablet */
      <div className="flex flex-col gap-2 pb-6 pt-2">
        <div className="px-3">
          <TeamBar color={top} compact />
        </div>
        <div className="mx-auto w-full max-w-[640px]">{board}</div>
        <div className="px-3">
          <TeamBar color={bottom} compact />
        </div>
        <div className="mx-auto w-full max-w-[640px]">
          {!setup && <MoveList horizontal />}
          {(reviewBanner || offerNote) && (
            <div className="space-y-2 px-3 py-1">
              {reviewBanner}
              {offerNote && <p className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium">{offerNote}</p>}
            </div>
          )}
          <GameActions />
          <div role="tablist" aria-label="Game panels" className="mx-3 flex gap-1 rounded-lg bg-raised p-1">
            {(setup ? (['setup', 'chat'] as Tab[]) : (['moves', 'chat'] as Tab[])).map((t) => (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative h-10 flex-1 rounded-md text-sm font-medium capitalize ${tab === t ? 'bg-surface shadow-sm' : 'text-fg-muted'}`}
              >
                {t === 'setup' ? 'Room setup' : t}
                {t === 'chat' && unread > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">{unread}</span>
                )}
              </button>
            ))}
          </div>
          <div className="mx-3 mt-2 overflow-hidden rounded-xl border border-line bg-surface">
            {tab === 'setup' && <RoomSetup />}
            {tab === 'moves' && (
              <div className="max-h-[320px] overflow-y-auto">
                <MoveList />
              </div>
            )}
            {tab === 'chat' && (
              <div className="h-[360px]">
                <RoomChat />
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default GameScreen;

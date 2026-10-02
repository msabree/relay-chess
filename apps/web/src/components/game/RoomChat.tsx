import { useContext, useEffect, useRef, useState } from 'react';
import { ChessGameContext } from '@/contexts/ChessGame';

/** Room chat. Everyone in the room, including the other team, can read it. */
const RoomChat = () => {
  const { room, game, sendChatMessage, userId } = useContext(ChessGameContext);
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const chat = room?.chat ?? [];
  const sideOf = (id: string) => (game?.teams.w.some((p) => p.id === id) ? 'w' : game?.teams.b.some((p) => p.id === id) ? 'b' : null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [chat.length]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3" aria-live="polite">
        {chat.length === 0 && <li className="text-sm text-fg-subtle">Say hi. The other team can read this too.</li>}
        {chat.map((m) => {
          const side = sideOf(m.userId);
          return (
            <li key={m.id} className="flex items-baseline gap-2 text-sm leading-snug">
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-[2px] ${side === 'w' ? 'bg-white ring-1 ring-ink-300' : side === 'b' ? 'bg-ink-950 ring-1 ring-ink-500' : 'bg-fg-subtle'}`}
              />
              <span className={`shrink-0 font-semibold ${m.userId === userId ? 'text-accent-ink' : ''}`}>
                {m.userId === userId ? 'You' : m.name}
              </span>
              <span className="min-w-0 break-words text-fg-muted">{m.text}</span>
            </li>
          );
        })}
        <div ref={end} />
      </ul>
      <form
        className="flex gap-2 border-t border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          sendChatMessage(text.trim());
          setText('');
        }}
      >
        <label htmlFor="chat-input" className="sr-only">Message the room</label>
        <input
          id="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Message the room"
          autoComplete="off"
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 text-sm placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
        <button type="submit" className="h-10 rounded-lg bg-fg px-4 text-sm font-semibold text-bg hover:bg-fg/85 disabled:opacity-40" disabled={!text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default RoomChat;

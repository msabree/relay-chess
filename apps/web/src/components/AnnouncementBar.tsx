import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import type { Announcement } from '@relay-chess/game';
import { api } from '@/apis/http';

const DISMISSED = 'relaychess.dismissed';

const readDismissed = (): string[] => {
  try {
    return JSON.parse(window.localStorage.getItem(DISMISSED) ?? '[]');
  } catch {
    return [];
  }
};

/**
 * Site-wide banners from the server (a launch, a planned deploy, anything).
 * Info banners can be dismissed on this device; warnings stay up.
 */
const AnnouncementBar = () => {
  const { data } = useQuery(
    ['announcements'],
    () => api.get<{ announcements: Announcement[] }>('/announcements').then((r) => r.data.announcements),
    { refetchInterval: 60_000, staleTime: 30_000, retry: false },
  );
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => setDismissed(readDismissed()), []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id].slice(-20);
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED, JSON.stringify(next));
    } catch {
      /* storage disabled */
    }
  };

  const shown = (data ?? []).filter((a) => a.tone === 'warning' || !dismissed.includes(a.id));
  if (!shown.length) return null;

  return (
    <div>
      {shown.map((a) => (
        <div
          key={a.id}
          role={a.tone === 'warning' ? 'alert' : 'status'}
          className={`flex items-center justify-center gap-3 border-b border-line px-4 py-2 text-center text-sm ${
            a.tone === 'warning' ? 'bg-accent text-accent-fg' : 'bg-accent/15'
          }`}
        >
          <p>
            {a.text}
            {a.link && (
              <>
                {' '}
                <a href={a.link} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  {a.linkText}
                </a>
              </>
            )}
          </p>
          {a.tone === 'info' && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(a.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-fg/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBar;

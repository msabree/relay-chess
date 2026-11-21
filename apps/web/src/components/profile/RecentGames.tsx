import Link from 'next/link';
import type { Profile } from '@/apis/players';
import GameCard from '@/components/profile/GameCard';

/** Sideways strip of game boards, with a link to all of them. */
const RecentGames = ({ profile, title = 'Recent games' }: { profile: Profile; title?: string }) => {
  const total = `${profile.record.games}${profile.record.capped ? '+' : ''}`;
  return (
    <section aria-labelledby="recent-games" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between">
        <h2 id="recent-games" className="text-lg font-semibold">
          {title}
        </h2>
        {profile.record.games > profile.games.length && (
          <Link href={`/players/${profile.player.id}/games`} className="text-sm font-semibold text-accent-ink underline-offset-4 hover:underline">
            View all {total}
          </Link>
        )}
      </div>
      {profile.games.length === 0 ? (
        <p className="text-sm text-fg-muted">No finished games yet. They show up here as soon as one ends.</p>
      ) : (
        <div className="-mx-4 flex snap-x gap-3.5 overflow-x-auto px-4 pb-2">
          {profile.games.map((g) => (
            <GameCard key={g.roomId} game={g} className="w-[212px] shrink-0 snap-start" />
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentGames;

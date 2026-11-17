import Link from 'next/link';
import type { Profile } from '@/apis/players';
import VerifiedMark from '@/components/VerifiedMark';
import { initials } from '@/components/game/util';

/** People you've teamed up with most. */
const Partners = ({ profile }: { profile: Profile }) => (
  <section aria-labelledby="partners" className="flex flex-col gap-3.5">
    <h2 id="partners" className="text-lg font-semibold">
      Partners
    </h2>
    {profile.partners.length === 0 ? (
      <p className="text-sm text-fg-muted">Teammates show up here after a 2v2.</p>
    ) : (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profile.partners.map((t) => (
          <li key={t.id}>
            <Link href={`/players/${t.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:bg-fg/5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-bold">{initials(t.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  {t.name}
                  {t.verified && <VerifiedMark size={12} />}
                </span>
                <span className="text-xs text-fg-muted">
                  {t.games} {t.games === 1 ? 'game' : 'games'} together · {t.wins} {t.wins === 1 ? 'win' : 'wins'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default Partners;

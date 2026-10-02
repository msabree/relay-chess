import type { Period, Store } from './store/types';

/**
 * Just-for-fun leaderboards: today and this week. They reset on their own when
 * the day or week rolls over (UTC), and old buckets expire from the database.
 */
export type Outcome = 'win' | 'loss' | 'draw';
export const PERIODS: Period[] = ['daily', 'weekly'];

const pad = (n: number) => String(n).padStart(2, '0');
const DAY = 86_400_000;

/** Bucket key and when the bucket ends, in UTC. Weeks start on Monday. */
export function bucket(period: Period, at: Date): { key: string; endsAt: Date } {
  const day = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  if (period === 'daily') {
    const d = new Date(day);
    return { key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, endsAt: new Date(day + DAY) };
  }
  const monday = day - ((new Date(day).getUTCDay() + 6) % 7) * DAY;
  const m = new Date(monday);
  return { key: `week-of-${m.getUTCFullYear()}-${pad(m.getUTCMonth() + 1)}-${pad(m.getUTCDate())}`, endsAt: new Date(monday + 7 * DAY) };
}

export async function recordOutcomes(store: Store, results: { userId: string; username: string; outcome: Outcome }[], at = new Date()) {
  for (const period of PERIODS) {
    const { key, endsAt } = bucket(period, at);
    // keep a finished bucket around for a day, then let the database drop it
    const expiresAt = new Date(endsAt.getTime() + DAY);
    for (const r of results) {
      await store.addScore({ period, key, userId: r.userId, name: r.username, outcome: r.outcome, expiresAt });
    }
  }
}

export interface LeaderboardRow {
  _rank: number;
  _userId: string;
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

async function ranked(store: Store, period: Period, now: Date): Promise<LeaderboardRow[]> {
  const rows = await store.listScores(period, bucket(period, now).key);
  return rows
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.userId.localeCompare(b.userId))
    .map((s, i) => ({
      _rank: i + 1,
      _userId: s.name,
      userId: s.userId,
      username: s.name,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      gamesPlayed: s.wins + s.losses + s.draws,
    }));
}

export async function leaderboardPage(store: Store, period: Period, page: number, pageSize: number, now = new Date()) {
  const rows = await ranked(store, period, now);
  const { endsAt } = bucket(period, now);
  return { rows: rows.slice(page * pageSize, page * pageSize + pageSize), page, total: rows.length, period, resetsAt: endsAt.toISOString() };
}

export async function leaderboardPosition(store: Store, userId: string, period: Period, now = new Date()) {
  const rows = await ranked(store, period, now);
  const i = rows.findIndex((r) => r.userId === userId);
  if (i < 0) return null;
  return { rank: i + 1, user: rows[i], surrounding: { above: rows.slice(Math.max(0, i - 2), i), below: rows.slice(i + 1, i + 3) } };
}

import type { LeaderboardEntry, Store, WinLossDraw } from './store/types';

export type Outcome = 'win' | 'loss' | 'draw';
export type Period = 'all-time' | 'daily' | 'weekly' | 'monthly';
export const PERIODS: Period[] = ['all-time', 'daily', 'weekly', 'monthly'];

const pad = (n: number) => String(n).padStart(2, '0');

/** UTC bucket keys. Week numbering matches the legacy API so old buckets line up. */
export function bucketKeys(date: Date) {
  const y = date.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(y, 0, 1));
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
  const week = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  return {
    daily: `${y}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
    weekly: `${y}-W${pad(week)}`,
    monthly: `${y}-${pad(date.getUTCMonth() + 1)}`,
  };
}

const empty = (): WinLossDraw => ({ wins: 0, losses: 0, draws: 0 });
const add = (s: WinLossDraw | undefined, o: Outcome): WinLossDraw => {
  const r = { ...empty(), ...s };
  if (o === 'win') r.wins++;
  else if (o === 'loss') r.losses++;
  else r.draws++;
  return r;
};

/** Pure: next leaderboard entry after one game. */
export function applyOutcome(
  prev: LeaderboardEntry | null,
  user: { userId: string; username: string },
  outcome: Outcome,
  at: Date,
): LeaderboardEntry {
  const keys = bucketKeys(at);
  const base: LeaderboardEntry = prev ?? {
    userId: user.userId,
    username: user.username,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    currentStreak: 0,
    highestStreak: 0,
    daily: {},
    weekly: {},
    monthly: {},
  };
  const totals = add(base, outcome);
  const currentStreak = outcome === 'win' ? base.currentStreak + 1 : outcome === 'loss' ? 0 : base.currentStreak;
  return {
    ...base,
    ...totals,
    username: user.username,
    gamesPlayed: base.gamesPlayed + 1,
    currentStreak,
    highestStreak: Math.max(base.highestStreak, currentStreak),
    daily: { ...base.daily, [keys.daily]: add(base.daily?.[keys.daily], outcome) },
    weekly: { ...base.weekly, [keys.weekly]: add(base.weekly?.[keys.weekly], outcome) },
    monthly: { ...base.monthly, [keys.monthly]: add(base.monthly?.[keys.monthly], outcome) },
  };
}

export async function recordOutcomes(
  store: Store,
  results: { userId: string; username: string; outcome: Outcome }[],
  at = new Date(),
) {
  for (const r of results) {
    const prev = await store.getLeaderboardEntry(r.userId);
    await store.putLeaderboardEntry(applyOutcome(prev, r, r.outcome, at));
  }
}

export interface LeaderboardRow extends LeaderboardEntry {
  _rank: number;
  _userId: string;
}

/** Ranked rows for a period, most wins first. Entries with no games in the period are dropped. */
async function ranked(store: Store, period: Period, now: Date): Promise<LeaderboardRow[]> {
  const all = await store.allLeaderboardEntries();
  const keys = bucketKeys(now);
  const rows = all
    .map((e) => {
      const stats = period === 'all-time' ? e : (e[period]?.[keys[period]] ?? empty());
      return { ...e, wins: stats.wins, losses: stats.losses, draws: stats.draws };
    })
    .filter((e) => period === 'all-time' || e.wins + e.losses + e.draws > 0)
    .sort((a, b) => b.wins - a.wins || a.userId.localeCompare(b.userId));
  return rows.map((e, i) => ({ ...e, _rank: i + 1, _userId: e.username || e.userId }));
}

export async function leaderboardPage(store: Store, period: Period, page: number, pageSize: number, now = new Date()) {
  const rows = await ranked(store, period, now);
  return { rows: rows.slice(page * pageSize, page * pageSize + pageSize), page, total: rows.length, period };
}

export async function leaderboardPosition(store: Store, userId: string, period: Period, now = new Date()) {
  const rows = await ranked(store, period, now);
  const i = rows.findIndex((r) => r.userId === userId);
  if (i < 0) return null;
  return {
    rank: i + 1,
    user: rows[i],
    surrounding: { above: rows.slice(Math.max(0, i - 2), i), below: rows.slice(i + 1, i + 3) },
  };
}

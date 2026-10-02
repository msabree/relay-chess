import type { Identity } from '../auth';

/**
 * Public matchmaking, same rules as the original server:
 * 1. A queued party plays another party of the same size and time control,
 * 2. or enough solo players to fill the other side,
 * 3. otherwise any 4 solo players with the same time control make a 2v2.
 */
export interface Match {
  timeControl: string;
  white: Identity[];
  black: Identity[];
  /** parties that were matched (so their lobby can be updated) */
  partyIds: string[];
}

interface SoloEntry {
  who: Identity;
  timeControl: string;
  at: number;
}
interface PartyEntry {
  partyId: string;
  members: Identity[];
  timeControl: string;
  at: number;
}

export class Matchmaker {
  private solo = new Map<string, SoloEntry>();
  private parties = new Map<string, PartyEntry>();

  constructor(
    private onMatch: (m: Match) => void,
    private opts: { now?: () => number; staleMs?: number; random?: () => number } = {},
  ) {}

  private get now() {
    return (this.opts.now ?? Date.now)();
  }

  joinSolo(who: Identity, timeControl: string) {
    this.removeFromParties(who.id);
    this.solo.set(who.id, { who, timeControl, at: this.now });
    this.run();
  }

  leaveSolo(userId: string) {
    return this.solo.delete(userId);
  }

  queueParty(partyId: string, members: Identity[], timeControl: string) {
    for (const m of members) this.solo.delete(m.id);
    for (const m of members) this.removeFromParties(m.id, partyId);
    this.parties.set(partyId, { partyId, members, timeControl, at: this.now });
    this.run();
  }

  unqueueParty(partyId: string) {
    return this.parties.delete(partyId);
  }

  /** User went offline: drop them from every queue. Returns parties that were dequeued. */
  removeUser(userId: string): string[] {
    this.solo.delete(userId);
    return this.removeFromParties(userId);
  }

  soloTimeControl(userId: string): string | null {
    return this.solo.get(userId)?.timeControl ?? null;
  }

  /** Players waiting per time control. */
  counts(): Map<string, number> {
    const counts = new Map<string, number>();
    for (const s of this.solo.values()) counts.set(s.timeControl, (counts.get(s.timeControl) ?? 0) + 1);
    for (const p of this.parties.values()) counts.set(p.timeControl, (counts.get(p.timeControl) ?? 0) + p.members.length);
    return counts;
  }

  /** Drop entries older than staleMs. Returns dequeued user ids and party ids. */
  sweep(): { users: string[]; parties: string[] } {
    const cutoff = this.now - (this.opts.staleMs ?? 5 * 60_000);
    const users: string[] = [];
    const parties: string[] = [];
    for (const [id, e] of this.solo) if (e.at < cutoff) (this.solo.delete(id), users.push(id));
    for (const [id, e] of this.parties) if (e.at < cutoff) (this.parties.delete(id), parties.push(id));
    return { users, parties };
  }

  private removeFromParties(userId: string, except?: string): string[] {
    const removed: string[] = [];
    for (const [id, e] of this.parties) {
      if (id !== except && e.members.some((m) => m.id === userId)) {
        this.parties.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  private shuffle<T>(xs: T[]): T[] {
    const a = [...xs];
    const rnd = this.opts.random ?? Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }

  private run() {
    for (let m = this.find(); m; m = this.find()) this.onMatch(m);
  }

  private find(): Match | null {
    const parties = [...this.parties.values()];
    const solos = [...this.solo.values()];

    for (const team of parties) {
      const rival = parties.find(
        (p) => p !== team && p.members.length === team.members.length && p.timeControl === team.timeControl,
      );
      if (rival) {
        this.parties.delete(team.partyId);
        this.parties.delete(rival.partyId);
        return { timeControl: team.timeControl, white: team.members, black: rival.members, partyIds: [team.partyId, rival.partyId] };
      }
      const pool = solos.filter((s) => s.timeControl === team.timeControl && !team.members.some((m) => m.id === s.who.id));
      if (pool.length >= team.members.length) {
        const picked = this.shuffle(pool).slice(0, team.members.length);
        this.parties.delete(team.partyId);
        for (const p of picked) this.solo.delete(p.who.id);
        return { timeControl: team.timeControl, white: team.members, black: picked.map((p) => p.who), partyIds: [team.partyId] };
      }
    }

    const byTc = new Map<string, SoloEntry[]>();
    for (const s of solos) byTc.set(s.timeControl, [...(byTc.get(s.timeControl) ?? []), s]);
    for (const [tc, group] of byTc) {
      if (group.length >= 4) {
        const four = this.shuffle(group).slice(0, 4);
        for (const p of four) this.solo.delete(p.who.id);
        return { timeControl: tc, white: four.slice(0, 2).map((p) => p.who), black: four.slice(2).map((p) => p.who), partyIds: [] };
      }
    }
    return null;
  }
}

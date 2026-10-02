import type { Party } from '@relay-chess/game';
import type { Identity } from '../auth';

export const MAX_PARTY = 4;
export const PARTY_ID = /^[A-Za-z0-9_-]{6,40}$/;

interface Member extends Identity {
  isHost: boolean;
  sockets: number;
}
interface PartyState {
  id: string;
  members: Member[];
  queuedFor: string | null;
}

/** Teammate lobbies: friends gather here, then the host queues them as a team. */
export class Parties {
  private parties = new Map<string, PartyState>();

  get(id: string) {
    return this.parties.get(id);
  }

  view(id: string): Party | null {
    const p = this.parties.get(id);
    if (!p) return null;
    return { id: p.id, members: p.members.map((m) => ({ id: m.id, name: m.name, isHost: m.isHost })), queuedFor: p.queuedFor };
  }

  members(id: string): Identity[] {
    return (this.parties.get(id)?.members ?? []).map(({ id, name, guest }) => ({ id, name, guest }));
  }

  /** Join (or create) a party. Returns whether membership changed. */
  join(id: string, who: Identity): { ok: true; changed: boolean } | { ok: false; error: string } {
    let p = this.parties.get(id);
    if (!p) {
      p = { id, members: [], queuedFor: null };
      this.parties.set(id, p);
    }
    const existing = p.members.find((m) => m.id === who.id);
    if (existing) {
      existing.sockets++;
      return { ok: true, changed: false };
    }
    if (p.members.length >= MAX_PARTY) return { ok: false, error: 'party-full' };
    p.members.push({ ...who, isHost: p.members.length === 0, sockets: 1 });
    return { ok: true, changed: true };
  }

  /** One socket left. Returns whether membership changed (member fully gone). */
  leave(id: string, userId: string): boolean {
    const p = this.parties.get(id);
    const m = p?.members.find((x) => x.id === userId);
    if (!p || !m) return false;
    if (--m.sockets > 0) return false;
    p.members = p.members.filter((x) => x.id !== userId);
    if (p.members.length === 0) {
      this.parties.delete(id);
      return true;
    }
    if (!p.members.some((x) => x.isHost)) p.members[0]!.isHost = true;
    return true;
  }

  isHost(id: string, userId: string) {
    return this.parties.get(id)?.members.some((m) => m.id === userId && m.isHost) ?? false;
  }

  setQueued(id: string, timeControl: string | null) {
    const p = this.parties.get(id);
    if (p) p.queuedFor = timeControl;
  }
}

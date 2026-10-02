import type { ContactMessage, GameRecord, Score, Store } from './types';

/** Everything in process memory. Default for local dev and tests. */
export function createMemoryStore(): Store & { contacts: ContactMessage[] } {
  const games = new Map<string, GameRecord>();
  const scores = new Map<string, Score>();
  const contacts: ContactMessage[] = [];
  const copy = <T>(v: T): T => structuredClone(v);

  return {
    kind: 'memory',
    contacts,
    async saveGame(game) {
      if (!games.has(game.roomId)) games.set(game.roomId, copy(game));
    },
    async getGame(roomId) {
      const g = games.get(roomId);
      return g ? copy(g) : null;
    },
    async setAnalysis(roomId, analysis) {
      const g = games.get(roomId);
      if (g) g.analysis = copy(analysis);
    },
    async addScore({ outcome, ...s }) {
      const id = `${s.period}|${s.key}|${s.userId}`;
      const cur = scores.get(id) ?? { ...s, wins: 0, losses: 0, draws: 0 };
      cur.name = s.name;
      cur.expiresAt = s.expiresAt;
      if (outcome === 'win') cur.wins++;
      else if (outcome === 'loss') cur.losses++;
      else cur.draws++;
      scores.set(id, cur);
    },
    async listScores(period, key) {
      return [...scores.values()].filter((s) => s.period === period && s.key === key).map(copy);
    },
    async saveContact(msg) {
      contacts.push(copy(msg));
    },
    async close() {},
  };
}

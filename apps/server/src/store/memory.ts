import { randomBytes } from 'node:crypto';
import type { ContactMessage, GameRecord, LeaderboardEntry, Store, UserRecord } from './types';

/** Everything in process memory. Default for local dev and tests. */
export function createMemoryStore(): Store & { contacts: ContactMessage[] } {
  const users = new Map<string, UserRecord>();
  const games = new Map<string, GameRecord>();
  const leaderboard = new Map<string, LeaderboardEntry>();
  const contacts: ContactMessage[] = [];
  const copy = <T>(v: T): T => structuredClone(v);

  return {
    kind: 'memory',
    contacts,
    async findUserById(id) {
      const u = users.get(id);
      return u ? copy(u) : null;
    },
    async findUserByEmail(email) {
      for (const u of users.values()) if (u.email === email) return copy(u);
      return null;
    },
    async createUser(data) {
      const user = { ...data, id: randomBytes(12).toString('hex') };
      users.set(user.id, user);
      return copy(user);
    },
    async updateUser(id, patch) {
      const u = users.get(id);
      if (!u) return null;
      Object.assign(u, patch);
      return copy(u);
    },
    async findUserByUsername(username) {
      const lower = username.toLowerCase();
      for (const u of users.values()) if (u.username.toLowerCase() === lower) return copy(u);
      return null;
    },
    async searchUsers(prefix, limit) {
      const lower = prefix.toLowerCase();
      return [...users.values()]
        .filter((u) => u.username.toLowerCase().startsWith(lower))
        .slice(0, limit)
        .map((u) => ({ id: u.id, username: u.username }));
    },
    async saveGame(game) {
      games.set(game.roomId, copy(game));
    },
    async getGame(roomId) {
      const g = games.get(roomId);
      return g ? copy(g) : null;
    },
    async listGames(userId, limit) {
      return [...games.values()]
        .filter((g) => g.userIds.includes(userId))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit)
        .map(copy);
    },
    async setAnalysis(roomId, analysis) {
      const g = games.get(roomId);
      if (g) g.analysis = copy(analysis);
    },
    async getLeaderboardEntry(userId) {
      const e = leaderboard.get(userId);
      return e ? copy(e) : null;
    },
    async putLeaderboardEntry(entry) {
      leaderboard.set(entry.userId, copy(entry));
    },
    async allLeaderboardEntries() {
      return [...leaderboard.values()].map(copy);
    },
    async saveContact(msg) {
      contacts.push(copy(msg));
    },
    async close() {},
  };
}

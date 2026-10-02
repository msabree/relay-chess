import { MongoClient, ObjectId, type Collection, type Document } from 'mongodb';
import type { ContactMessage, GameRecord, LeaderboardEntry, Store, UserRecord } from './types';

interface UserDoc {
  _id: ObjectId;
  email: string;
  username: string;
  boardColor?: string;
  createdAtTimestamp?: Date;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toUser = (d: UserDoc): UserRecord => ({
  id: d._id.toHexString(),
  email: d.email,
  username: d.username,
  boardColor: d.boardColor,
  createdAt: d.createdAtTimestamp ?? d._id.getTimestamp(),
});
const strip = <T extends Document>(d: T | null) => {
  if (!d) return null;
  const { _id, ...rest } = d;
  return rest;
};

/** MongoDB store. Collection names and shapes match the legacy API so existing data carries over. */
export async function createMongoStore(url: string, dbName: string): Promise<Store> {
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);
  const users: Collection<UserDoc> = db.collection('users');
  const games: Collection<GameRecord> = db.collection('games');
  const leaderboard: Collection<LeaderboardEntry> = db.collection('leaderboard');
  const contact: Collection<ContactMessage> = db.collection('contact-us');

  await Promise.all([
    users.createIndex({ email: 1 }),
    users.createIndex({ username: 1 }, { collation: { locale: 'en', strength: 2 } }),
    games.createIndex({ roomId: 1 }),
    games.createIndex({ userIds: 1, timestamp: -1 }),
    leaderboard.createIndex({ userId: 1 }),
  ]);

  const byId = (id: string) => (ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null);

  return {
    kind: 'mongo',
    async findUserById(id) {
      const _id = byId(id);
      if (!_id) return null;
      const d = await users.findOne({ _id });
      return d ? toUser(d) : null;
    },
    async findUserByEmail(email) {
      const d = await users.findOne({ email });
      return d ? toUser(d) : null;
    },
    async createUser(data) {
      const doc: UserDoc = {
        _id: new ObjectId(),
        email: data.email,
        username: data.username,
        boardColor: data.boardColor,
        createdAtTimestamp: data.createdAt,
      };
      await users.insertOne(doc);
      return toUser(doc);
    },
    async updateUser(id, patch) {
      const _id = byId(id);
      if (!_id) return null;
      const d = await users.findOneAndUpdate({ _id }, { $set: patch }, { returnDocument: 'after' });
      return d ? toUser(d) : null;
    },
    async findUserByUsername(username) {
      const d = await users.findOne({ username }, { collation: { locale: 'en', strength: 2 } });
      return d ? toUser(d) : null;
    },
    async searchUsers(prefix, limit) {
      const docs = await users
        .find({ username: { $regex: `^${escapeRegex(prefix)}`, $options: 'i' } })
        .limit(limit)
        .project<{ _id: ObjectId; username: string }>({ username: 1 })
        .toArray();
      return docs.map((d) => ({ id: d._id.toHexString(), username: d.username }));
    },
    async saveGame(game) {
      await games.updateOne({ roomId: game.roomId }, { $setOnInsert: game }, { upsert: true });
    },
    async getGame(roomId) {
      return strip(await games.findOne({ roomId })) as GameRecord | null;
    },
    async listGames(userId, limit) {
      const docs = await games.find({ userIds: userId }).sort({ timestamp: -1 }).limit(limit).toArray();
      return docs.map((d) => strip(d) as GameRecord);
    },
    async setAnalysis(roomId, analysis) {
      await games.updateOne({ roomId }, { $set: { analysis } });
    },
    async getLeaderboardEntry(userId) {
      return strip(await leaderboard.findOne({ userId })) as LeaderboardEntry | null;
    },
    async putLeaderboardEntry(entry) {
      await leaderboard.replaceOne({ userId: entry.userId }, entry, { upsert: true });
    },
    async allLeaderboardEntries() {
      const docs = await leaderboard.find({}).toArray();
      return docs.map((d) => strip(d) as LeaderboardEntry);
    },
    async saveContact(msg) {
      await contact.insertOne(msg);
    },
    async close() {
      await client.close();
    },
  };
}

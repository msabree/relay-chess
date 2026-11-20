import { MongoClient, type Collection, type Document } from 'mongodb';
import type { AnnouncementDoc, ContactMessage, GameRecord, Score, Store } from './types';

const strip = <T extends Document>(d: T | null) => {
  if (!d) return null;
  const { _id, ...rest } = d;
  return rest;
};

/**
 * MongoDB store. Uses new collections so nothing from the account era is
 * touched: `recent_games` (kept forever, so we can count and review every game)
 * and `scores` (deleted after their day or week is over).
 */
export async function createMongoStore(url: string, dbName: string): Promise<Store> {
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);
  const games: Collection<GameRecord> = db.collection('recent_games');
  const scores: Collection<Score> = db.collection('scores');
  const contact: Collection<ContactMessage> = db.collection('contact-us');
  const announcements: Collection<AnnouncementDoc> = db.collection('announcements');
  const retired: Collection<{ _id: string; at: Date }> = db.collection('retired_players');
  const plusWaitlist: Collection<{ _id: string; playerId?: string; at: Date }> = db.collection('plus_waitlist');
  const retiredNames: Collection<{ _id: string; at: Date }> = db.collection('retired_names');

  // Games used to expire after 30 days. Drop that TTL index if an older deploy created it.
  await games.dropIndex('timestamp_1').catch(() => {});

  await Promise.all([
    games.createIndex({ roomId: 1 }, { unique: true }),
    games.createIndex({ timestamp: 1 }),
    games.createIndex({ userIds: 1, timestamp: -1 }),
    scores.createIndex({ period: 1, key: 1, userId: 1 }, { unique: true }),
    scores.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  return {
    kind: 'mongo',
    db,
    async saveGame(game) {
      await games.updateOne({ roomId: game.roomId }, { $setOnInsert: game }, { upsert: true });
    },
    async getGame(roomId) {
      return strip(await games.findOne({ roomId })) as GameRecord | null;
    },
    async setAnalysis(roomId, analysis) {
      await games.updateOne({ roomId }, { $set: { analysis } });
    },
    async countGames() {
      // Reads collection metadata, no scan.
      return games.estimatedDocumentCount();
    },
    async addScore({ outcome, period, key, userId, name, expiresAt }) {
      await scores.updateOne(
        { period, key, userId },
        {
          $set: { name, expiresAt },
          $inc: { wins: outcome === 'win' ? 1 : 0, losses: outcome === 'loss' ? 1 : 0, draws: outcome === 'draw' ? 1 : 0 },
        },
        { upsert: true },
      );
    },
    async listScores(period, key) {
      const docs = await scores.find({ period, key }).toArray();
      return docs.map((d) => strip(d) as Score);
    },
    async gamesFor(userIds, limit) {
      const docs = await games.find({ userIds: { $in: userIds } }, { projection: { gameHistory: { $slice: -1 }, analysis: 0 } }).sort({ timestamp: -1 }).limit(limit).toArray();
      return docs.map((d) => strip(d) as GameRecord);
    },
    async saveContact(msg) {
      await contact.insertOne(msg);
    },
    async joinPlusWaitlist(email, playerId) {
      await plusWaitlist.updateOne({ _id: email }, { $setOnInsert: { at: new Date(), ...(playerId ? { playerId } : {}) } }, { upsert: true });
    },
    async retirePlayers(ids) {
      if (!ids.length) return;
      await retired.bulkWrite(ids.map((id) => ({ updateOne: { filter: { _id: id }, update: { $setOnInsert: { at: new Date() } }, upsert: true } })));
    },
    async retiredPlayers() {
      return (await retired.find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
    },
    async retireName(key) {
      await retiredNames.updateOne({ _id: key }, { $setOnInsert: { at: new Date() } }, { upsert: true });
    },
    async retiredNames() {
      return (await retiredNames.find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id);
    },
    async deleteScores(userIds) {
      await scores.deleteMany({ userId: { $in: userIds } });
    },
    async liveAnnouncements(now) {
      const docs = await announcements
        .find({
          active: true,
          $and: [
            { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
            { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gt: now } }] },
          ],
        })
        .sort({ order: 1, _id: 1 })
        .limit(5)
        .toArray();
      return docs.map(({ _id, ...d }) => ({ ...d, id: String(_id) }));
    },
    async close() {
      await client.close();
    },
  };
}

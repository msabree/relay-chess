import { MongoClient, type Collection, type Document } from 'mongodb';
import type { ContactMessage, GameRecord, Score, Store } from './types';

const GAME_TTL_SECONDS = 30 * 24 * 60 * 60;

const strip = <T extends Document>(d: T | null) => {
  if (!d) return null;
  const { _id, ...rest } = d;
  return rest;
};

/**
 * MongoDB store. Uses new collections so nothing from the account era is
 * touched: `recent_games` (deleted after 30 days) and `scores` (deleted after
 * their day or week is over).
 */
export async function createMongoStore(url: string, dbName: string): Promise<Store> {
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);
  const games: Collection<GameRecord> = db.collection('recent_games');
  const scores: Collection<Score> = db.collection('scores');
  const contact: Collection<ContactMessage> = db.collection('contact-us');

  await Promise.all([
    games.createIndex({ roomId: 1 }, { unique: true }),
    games.createIndex({ timestamp: 1 }, { expireAfterSeconds: GAME_TTL_SECONDS }),
    scores.createIndex({ period: 1, key: 1, userId: 1 }, { unique: true }),
    scores.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  return {
    kind: 'mongo',
    async saveGame(game) {
      await games.updateOne({ roomId: game.roomId }, { $setOnInsert: game }, { upsert: true });
    },
    async getGame(roomId) {
      return strip(await games.findOne({ roomId })) as GameRecord | null;
    },
    async setAnalysis(roomId, analysis) {
      await games.updateOne({ roomId }, { $set: { analysis } });
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
    async saveContact(msg) {
      await contact.insertOne(msg);
    },
    async close() {
      await client.close();
    },
  };
}

import 'dotenv/config';
import { createServer } from './app';
import { loadConfig } from './config';
import { createMemoryStore } from './store/memory';
import { createMongoStore } from './store/mongo';

const config = loadConfig();
const store = config.MONGODB_URL
  ? await createMongoStore(config.MONGODB_URL, config.DATABASE_NAME)
  : createMemoryStore();
if (store.kind === 'memory') console.warn('MONGODB_URL not set: using in-memory storage. Data is lost on restart.');

const server = createServer(config, store);
server.http.listen(config.PORT, () => console.log(`Relay Chess server on http://localhost:${config.PORT}`));

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, () => {
    server.close().finally(() => process.exit(0));
  });
}

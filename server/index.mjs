import { resolve } from 'node:path';
import { createPool } from './db.mjs';
import { createApp } from './app.mjs';

const port = Number(process.env.PORT || 3000);
const staticRoot = resolve(process.argv[2] || '.');
const sessionSecret = process.env.SESSION_SECRET;
const pool = createPool();
const app = createApp({ pool, sessionSecret, staticRoot });
const server = app.listen(port, '127.0.0.1', () => console.log(`CuidadOnline: http://localhost:${port} (${staticRoot})`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from './config.js';

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pidor_draws (
    id INTEGER PRIMARY KEY,
    peer_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS pidor_draws_peer_day ON pidor_draws (peer_id, day);
`);

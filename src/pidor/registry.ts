import { db } from '../db.js';

export type Person = { id: number; name: string };

const upsertUser = db.prepare(
  'INSERT INTO users (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name',
);
const insertDraw = db.prepare(
  'INSERT INTO pidor_draws (peer_id, day, user_id, created_at) VALUES (?, ?, ?, ?)',
);
const selectDrawOfDay = db.prepare(
  `SELECT u.name AS name FROM pidor_draws d JOIN users u ON u.id = d.user_id
   WHERE d.peer_id = ? AND d.day = ? ORDER BY d.id LIMIT 1`,
);
const selectStats = db.prepare(
  `SELECT d.user_id AS id, u.name AS name, COUNT(*) AS count
   FROM pidor_draws d JOIN users u ON u.id = d.user_id
   WHERE d.peer_id = ?
   GROUP BY d.user_id
   ORDER BY count DESC, MIN(d.id)`,
);

export function saveUsers(people: Person[]): void {
  for (const p of people) upsertUser.run(p.id, p.name);
}

export function recordDraw(peerId: number, day: string, person: Person): void {
  saveUsers([person]);
  insertDraw.run(peerId, day, person.id, Date.now());
}

export function drawnName(peerId: number, day: string): string | undefined {
  const row = selectDrawOfDay.get(peerId, day) as { name: string } | undefined;
  return row?.name;
}

export function stats(peerId: number): Array<{ id: number; name: string; count: number }> {
  return selectStats.all(peerId) as Array<{ id: number; name: string; count: number }>;
}

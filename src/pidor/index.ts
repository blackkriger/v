import type { API, MessageContext } from 'vk-io';
import { CHAT_PEER_ID, OWNER_ID, TIME_ZONE } from '../config.js';
import { type Person, drawnName, recordDraw, saveUsers, stats } from './registry.js';
import { FINALES, MIDDLES, OPENINGS, STATS_HEADER, alreadyDrawn, statsLine } from './texts.js';

const DAILY_LIMIT_PEERS = new Set([CHAT_PEER_ID]);
const drawing = new Set<number>();

export function pidorCommands(api: API): Record<string, (ctx: MessageContext) => Promise<void>> {
  return {
    '/пидорег': (ctx) => draw(api, ctx),
    '/пидорстат': (ctx) => showStats(api, ctx),
  };
}

async function draw(api: API, ctx: MessageContext): Promise<void> {
  const peerId = ctx.peerId;
  if (drawing.has(peerId)) return;
  drawing.add(peerId);
  try {
    const day = today();
    if (DAILY_LIMIT_PEERS.has(peerId)) {
      const name = drawnName(peerId, day);
      if (name) {
        await ctx.send(alreadyDrawn(name));
        return;
      }
    }

    const people = await participants(api, peerId);
    if (people.length === 0) return;
    const chosen = pick(people);
    recordDraw(peerId, day, chosen);

    await ctx.send(pick(OPENINGS));
    await pause();
    await ctx.send(pick(MIDDLES));
    await pause();
    await ctx.send(pick(FINALES)(`[id${chosen.id}|${chosen.name}]`));
  } finally {
    drawing.delete(peerId);
  }
}

async function showStats(api: API, ctx: MessageContext): Promise<void> {
  if (drawing.has(ctx.peerId)) return;
  const present = new Set((await participants(api, ctx.peerId)).map((p) => p.id));
  const rows = stats(ctx.peerId);
  if (rows.length === 0) return;
  const lines = rows.map((r, i) => statsLine(i + 1, r.name, !present.has(r.id), r.count));
  await ctx.send([STATS_HEADER, ...lines].join('\n'));
}

async function participants(api: API, peerId: number): Promise<Person[]> {
  let people: Person[];
  if (peerId === OWNER_ID) {
    const [user] = await api.users.get({ user_ids: [OWNER_ID] });
    people = [{ id: user.id, name: `${user.first_name} ${user.last_name}` }];
  } else {
    const { items, profiles = [] } = await api.messages.getConversationMembers({ peer_id: peerId });
    const members = new Set(items.map((i) => i.member_id).filter((id) => id > 0));
    people = profiles
      .filter((p) => members.has(p.id))
      .map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}` }));
  }
  saveUsers(people);
  return people;
}

function today(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function pause(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));
}

export const CHAT_PEER_ID = 2000000002;
export const OWNER_ID = 175983528;
export const TIME_ZONE = 'Europe/Moscow';
export const DB_PATH = process.env.DB_PATH ?? 'data/v_bot.db';

export const ALLOWED_PEERS = new Set([CHAT_PEER_ID, OWNER_ID]);

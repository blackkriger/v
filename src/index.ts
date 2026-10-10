import { VK } from 'vk-io';
import { ALLOWED_PEERS } from './config.js';
import { pidorCommands } from './pidor/index.js';

const token = process.env.VK_TOKEN;
if (!token) throw new Error('VK_TOKEN is not set');

const vk = new VK({ token });

const commands = {
  ...pidorCommands(vk.api),
};

vk.updates.on('message_new', async (ctx) => {
  if (ctx.isOutbox || !ALLOWED_PEERS.has(ctx.peerId)) return;
  const command = ctx.text?.trim().split(/\s+/)[0].toLowerCase();
  const handler = command ? commands[command] : undefined;
  if (!handler) return;
  try {
    await handler(ctx);
  } catch (error) {
    console.error(`${command} failed in ${ctx.peerId}:`, error);
  }
});

await vk.updates.start();
console.log('v_bot started');

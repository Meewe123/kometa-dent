import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { serviceName } from '../src/i18n/index.js';
import { createLogger } from '../src/logger.js';
import { createStore } from '../src/store.js';

export const NOW = new Date('2026-10-05T08:00:00Z'); // Monday 13:00 in Tashkent
export const ADMIN_TOKEN = 'test-admin-token-1234567890';

/** Starts the real app on a random port with an in-memory store. */
export async function startApp({ env = {}, store = createStore() } = {}) {
  const config = loadConfig(
    { ADMIN_TOKEN, SITE_URL: 'https://kometa.example', NODE_ENV: 'test', ...env },
    [],
  );
  const sent = [];
  const notifier = { send: async (text) => sent.push(text) };
  const app = createApp({
    config,
    store,
    notifier,
    serviceName,
    logger: createLogger('silent'),
    now: () => NOW,
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const request = (path, { method = 'GET', body, headers = {}, raw } = {}) =>
    fetch(base + path, {
      method,
      headers:
        body !== undefined || raw ? { 'Content-Type': 'application/json', ...headers } : headers,
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });

  return { base, store, sent, request, close: () => new Promise((r) => server.close(r)) };
}

export const booking = (over = {}) => ({
  name: 'Дилноза',
  phone: '+998 90 123 45 67',
  service: 'implants',
  date: '2026-10-06',
  time: '10:00',
  ...over,
});

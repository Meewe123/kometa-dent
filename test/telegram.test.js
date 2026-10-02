import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createLogger } from '../src/logger.js';
import { createTelegramNotifier, escapeHtml, formatAppointmentMessage } from '../src/telegram.js';

const appointment = {
  name: '<b>Ali</b> & co',
  phone: '+998901234567',
  service: 'caries',
  date: '2026-10-09',
  time: '10:30',
  comment: '<script>alert(1)</script>',
  lang: 'uz',
};

describe('telegram', () => {
  it('escapes HTML special characters', () => {
    assert.equal(
      escapeHtml(`<a href="x">'&'</a>`),
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('never lets user input become markup', () => {
    const text = formatAppointmentMessage(appointment, {
      serviceName: () => 'Лечение кариеса',
      siteUrl: 'https://example.com',
    });
    assert.ok(!text.includes('<script>'));
    assert.ok(!text.includes('<b>Ali'));
    assert.ok(text.includes('&lt;b&gt;Ali&lt;/b&gt; &amp; co'));
    assert.ok(text.includes('Лечение кариеса'));
    assert.ok(text.includes('10:30'));
    assert.ok(text.includes('https://example.com/admin'));
    assert.ok(text.includes('узбекский'));
  });

  it('logs and swallows API errors', async () => {
    const lines = [];
    const logger = createLogger('error', (l) => lines.push(JSON.parse(l)));
    const notifier = createTelegramNotifier({
      token: 't',
      chatId: 'c',
      logger,
      fetchImpl: async () => new Response('{"ok":false}', { status: 400 }),
    });
    assert.equal(await notifier.send('hi'), false);
    assert.equal(lines[0].event, 'telegram.failed');
    assert.equal(lines[0].status, 400);
  });

  it('survives network errors', async () => {
    const notifier = createTelegramNotifier({
      token: 't',
      chatId: 'c',
      logger: createLogger('silent'),
      fetchImpl: async () => {
        throw new Error('ECONNRESET');
      },
    });
    assert.equal(await notifier.send('hi'), false);
  });
});

describe('logger', () => {
  it('keeps its own timestamp when a field is called "time"', () => {
    const lines = [];
    createLogger('info', (l) => lines.push(JSON.parse(l))).info('x', { time: '10:00' });
    assert.equal(lines[0].time, '10:00');
    assert.match(lines[0].ts, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(lines[0].event, 'x');
  });
});

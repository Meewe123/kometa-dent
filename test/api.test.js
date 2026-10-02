import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ADMIN_TOKEN, booking, startApp } from './helpers.js';

const auth = { Authorization: `Bearer ${ADMIN_TOKEN}` };

describe('booking API', () => {
  let app;
  before(async () => (app = await startApp()));
  after(() => app.close());

  it('creates an appointment and notifies the clinic', async () => {
    const res = await app.request('/api/appointments', { method: 'POST', body: booking() });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.match(body.appointment.id, /^[0-9a-f-]{36}$/);
    assert.equal(app.sent.length, 1);
    assert.ok(app.sent[0].includes('Имплантация'));
  });

  it('rejects a second booking for the same slot with 409', async () => {
    const res = await app.request('/api/appointments', {
      method: 'POST',
      body: booking({ name: 'Другой человек' }),
    });
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), {
      ok: false,
      error: 'slot_taken',
      fields: { time: 'taken' },
    });
  });

  it('shows the booked slot as unavailable', async () => {
    const res = await app.request('/api/slots?date=2026-10-06');
    const { slots } = await res.json();
    assert.equal(slots.find((s) => s.time === '10:00').available, false);
    assert.equal(slots.find((s) => s.time === '10:30').available, true);
  });

  it('returns field errors as codes', async () => {
    const res = await app.request('/api/appointments', {
      method: 'POST',
      body: { name: 123, phone: 'abc', service: 'x', date: '2020-01-01', time: '03:00' },
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'validation');
    assert.deepEqual(Object.keys(body.fields).sort(), ['date', 'name', 'phone', 'service', 'time']);
  });

  it('answers malformed JSON with 400 and no stack trace', async () => {
    const res = await app.request('/api/appointments', { method: 'POST', raw: '{bad' });
    assert.equal(res.status, 400);
    const text = await res.text();
    assert.ok(!text.includes('at '), 'response must not contain a stack trace');
    assert.deepEqual(JSON.parse(text), { ok: false, error: 'invalid_json' });
  });

  it('rejects oversized bodies', async () => {
    const res = await app.request('/api/appointments', {
      method: 'POST',
      body: booking({ comment: 'x'.repeat(20_000) }),
    });
    assert.equal(res.status, 413);
  });

  it('pretends to accept honeypot submissions without saving them', async () => {
    const before = app.store.list().length;
    const res = await app.request('/api/appointments', {
      method: 'POST',
      body: booking({ time: '11:00', website: 'http://spam.example' }),
    });
    assert.equal(res.status, 201);
    assert.equal(app.store.list().length, before);
  });

  it('validates the slots query', async () => {
    assert.equal((await app.request('/api/slots')).status, 400);
    assert.equal((await app.request('/api/slots?date=nope')).status, 400);
    const far = await (await app.request('/api/slots?date=2030-01-01')).json();
    assert.deepEqual(far.slots, []);
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await app.request('/api/contact', { method: 'POST', body: {} });
    assert.equal(res.status, 404);
    assert.equal((await res.json()).error, 'not_found');
  });
});

describe('admin API', () => {
  let app;
  before(async () => (app = await startApp()));
  after(() => app.close());

  it('requires a token', async () => {
    assert.equal((await app.request('/api/admin/appointments')).status, 401);
    const wrong = await app.request('/api/admin/appointments', {
      headers: { Authorization: 'Bearer wrong' },
    });
    assert.equal(wrong.status, 401);
  });

  it('lists appointments and changes their status', async () => {
    await app.request('/api/appointments', { method: 'POST', body: booking() });
    const list = await (await app.request('/api/admin/appointments', { headers: auth })).json();
    assert.equal(list.appointments.length, 1);
    const [first] = list.appointments;
    assert.equal(first.phone, '+998901234567');

    const res = await app.request(`/api/admin/appointments/${first.id}`, {
      method: 'PATCH',
      headers: auth,
      body: { status: 'cancelled' },
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).appointment.status, 'cancelled');

    const slots = await (await app.request('/api/slots?date=2026-10-06')).json();
    assert.equal(slots.slots.find((s) => s.time === '10:00').available, true);
  });

  it('rejects unknown statuses and ids', async () => {
    const bad = await app.request('/api/admin/appointments/x', {
      method: 'PATCH',
      headers: auth,
      body: { status: 'deleted' },
    });
    assert.equal(bad.status, 400);
    const missing = await app.request('/api/admin/appointments/x', {
      method: 'PATCH',
      headers: auth,
      body: { status: 'confirmed' },
    });
    assert.equal(missing.status, 404);
  });

  it('is disabled when no token is configured', async () => {
    const locked = await startApp({ env: { ADMIN_TOKEN: '' } });
    const res = await locked.request('/api/admin/appointments', { headers: auth });
    assert.equal(res.status, 503);
    await locked.close();
  });

  it('ignores a token that is too short', async () => {
    const weak = await startApp({ env: { ADMIN_TOKEN: 'short' } });
    const res = await weak.request('/api/admin/appointments', {
      headers: { Authorization: 'Bearer short' },
    });
    assert.equal(res.status, 503);
    await weak.close();
  });
});

describe('HTTP basics', () => {
  let app;
  before(async () => (app = await startApp()));
  after(() => app.close());

  it('sets security headers and hides the framework', async () => {
    const res = await app.request('/healthz');
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });

  it('returns 404 for missing files instead of the home page', async () => {
    const res = await app.request('/assets/clinic.jpg');
    assert.equal(res.status, 404);
  });
});

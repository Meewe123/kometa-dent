import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { SlotTakenError, createStore } from '../src/store.js';

const fields = (over = {}) => ({
  name: 'Test',
  phone: '+998901234567',
  service: 'caries',
  date: '2026-10-06',
  time: '10:00',
  comment: '',
  lang: 'ru',
  ...over,
});

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kometa-'));
  return path.join(dir, 'appointments.json');
}

describe('store', () => {
  it('refuses a second booking for the same slot', () => {
    const store = createStore();
    store.create(fields());
    assert.throws(() => store.create(fields({ name: 'Other' })), SlotTakenError);
    assert.equal(store.list().length, 1);
  });

  it('frees the slot when an appointment is cancelled', () => {
    const store = createStore();
    const first = store.create(fields());
    store.setStatus(first.id, 'cancelled');
    assert.doesNotThrow(() => store.create(fields({ name: 'Other' })));
    assert.deepEqual([...store.bookedTimes('2026-10-06')], ['10:00']);
  });

  it('does not reactivate a cancelled appointment over a new one', () => {
    const store = createStore();
    const first = store.create(fields());
    store.setStatus(first.id, 'cancelled');
    store.create(fields({ name: 'Other' }));
    assert.throws(() => store.setStatus(first.id, 'confirmed'), SlotTakenError);
    assert.equal(store.get(first.id).status, 'cancelled');
  });

  it('returns null for unknown ids', () => {
    assert.equal(createStore().setStatus('nope', 'confirmed'), null);
  });

  it('persists to disk and reads the data back', () => {
    const file = tempFile();
    const created = createStore({ file }).create(fields());
    const reopened = createStore({ file });
    assert.equal(reopened.get(created.id).name, 'Test');
    assert.ok(!fs.readdirSync(path.dirname(file)).some((f) => f.endsWith('.tmp')));
  });

  it('keeps records from the old file format', () => {
    const file = tempFile();
    fs.writeFileSync(
      file,
      JSON.stringify({
        appointments: [
          { id: 1718467200000, name: 'Old', date: '2026-10-06', time: '11:00', status: 'pending' },
        ],
        contacts: [{ id: 1 }],
      }),
    );
    const store = createStore({ file });
    assert.deepEqual([...store.bookedTimes('2026-10-06')], ['11:00']);
    store.setStatus('1718467200000', 'confirmed');
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(saved.appointments[0].status, 'confirmed');
    assert.equal(saved.contacts.length, 1);
  });

  it('fails loudly on a corrupted file instead of losing data', () => {
    const file = tempFile();
    fs.writeFileSync(file, '{"appointments": [');
    assert.throws(() => createStore({ file }), SyntaxError);
  });
});

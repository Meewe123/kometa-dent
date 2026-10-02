import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizePhone, validateAppointment } from '../src/validation.js';

const NOW = new Date('2026-10-05T08:00:00Z'); // 13:00 in Tashkent
const valid = {
  name: '  Дилноза   Азизова ',
  phone: '+998 97 125-55-51',
  service: 'caries',
  date: '2026-10-06',
  time: '10:00',
  comment: 'Болит зуб',
};

describe('normalizePhone', () => {
  it('adds +998 to a nine-digit local number', () => {
    assert.equal(normalizePhone('97 125 55 51'), '+998971255551');
  });
  it('keeps full international numbers', () => {
    assert.equal(normalizePhone('+998 (97) 125-55-51'), '+998971255551');
    assert.equal(normalizePhone('+7 912 345 67 89'), '+79123456789');
  });
  it('rejects letters, too short and too long numbers', () => {
    assert.equal(normalizePhone('call me'), null);
    assert.equal(normalizePhone('12345'), null);
    assert.equal(normalizePhone('1'.repeat(16)), null);
    assert.equal(normalizePhone(998971255551), null);
  });
});

describe('validateAppointment', () => {
  it('accepts a correct request and normalizes it', () => {
    const result = validateAppointment(valid, NOW);
    assert.equal(result.ok, true);
    assert.deepEqual(result.value, {
      name: 'Дилноза Азизова',
      phone: '+998971255551',
      service: 'caries',
      date: '2026-10-06',
      time: '10:00',
      comment: 'Болит зуб',
      lang: 'ru',
    });
  });

  it('reports every missing field at once', () => {
    const result = validateAppointment({}, NOW);
    assert.equal(result.ok, false);
    assert.deepEqual(result.errors, {
      name: 'required',
      phone: 'required',
      service: 'required',
      date: 'required',
      time: 'required',
    });
  });

  it('rejects wrong types instead of crashing', () => {
    const result = validateAppointment(
      { ...valid, name: 123, phone: ['x'], comment: { a: 1 } },
      NOW,
    );
    assert.deepEqual(result.errors, { name: 'required', phone: 'required', comment: 'invalid' });
    assert.equal(validateAppointment(null, NOW).ok, false);
    assert.equal(validateAppointment([], NOW).ok, false);
  });

  it('rejects unknown services and off-grid times', () => {
    const result = validateAppointment({ ...valid, service: '<script>', time: '03:00' }, NOW);
    assert.deepEqual(result.errors, { service: 'invalid', time: 'invalid' });
  });

  it('rejects dates in the past or outside the booking window', () => {
    assert.equal(
      validateAppointment({ ...valid, date: '2026-10-04' }, NOW).errors.date,
      'unavailable',
    );
    assert.equal(
      validateAppointment({ ...valid, date: '2027-01-01' }, NOW).errors.date,
      'unavailable',
    );
    assert.equal(validateAppointment({ ...valid, date: '2026-13-01' }, NOW).errors.date, 'invalid');
  });

  it('rejects a slot that has already started today', () => {
    const result = validateAppointment({ ...valid, date: '2026-10-05', time: '12:00' }, NOW);
    assert.equal(result.errors.time, 'unavailable');
  });

  it('enforces length limits', () => {
    assert.equal(validateAppointment({ ...valid, name: 'A' }, NOW).errors.name, 'too_short');
    assert.equal(
      validateAppointment({ ...valid, name: 'A'.repeat(81) }, NOW).errors.name,
      'too_long',
    );
    assert.equal(
      validateAppointment({ ...valid, comment: 'x'.repeat(501) }, NOW).errors.comment,
      'too_long',
    );
  });

  it('strips control characters', () => {
    const result = validateAppointment({ ...valid, name: 'Ali\u0000\u0007 Valiyev' }, NOW);
    assert.equal(result.value.name, 'Ali Valiyev');
  });
});

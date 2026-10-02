import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ALL_SLOTS,
  BOOKING_WINDOW_DAYS,
  bookableDates,
  clinicNow,
  isDateBookable,
  isSlotTooSoon,
  isValidDate,
  slotsForDate,
} from '../src/schedule.js';

// 2026-10-05 08:00 UTC = 13:00 in Tashkent (UTC+5)
const NOON_ISH = new Date('2026-10-05T08:00:00Z');
// 2026-10-05 21:30 UTC = 02:30 on 2026-10-06 in Tashkent
const NIGHT = new Date('2026-10-05T21:30:00Z');

describe('schedule', () => {
  it('generates 30-minute slots from 09:00 to 20:30', () => {
    assert.equal(ALL_SLOTS[0], '09:00');
    assert.equal(ALL_SLOTS.at(-1), '20:30');
    assert.equal(ALL_SLOTS.length, 24);
  });

  it('uses Tashkent time, not the server time zone', () => {
    assert.deepEqual(clinicNow(NOON_ISH), { date: '2026-10-05', minutes: 13 * 60 });
    assert.equal(clinicNow(NIGHT).date, '2026-10-06');
  });

  it('validates calendar dates strictly', () => {
    assert.ok(isValidDate('2026-02-28'));
    assert.ok(!isValidDate('2026-02-30'));
    assert.ok(!isValidDate('2026-2-3'));
    assert.ok(!isValidDate(20260203));
    assert.ok(!isValidDate(undefined));
  });

  it('allows booking from today for a fixed window', () => {
    const dates = bookableDates(NOON_ISH);
    assert.equal(dates.length, BOOKING_WINDOW_DAYS);
    assert.equal(dates[0], '2026-10-05');
    assert.ok(!isDateBookable('2026-10-04', NOON_ISH));
    assert.ok(
      !isDateBookable(
        dates.at(-1).replace(/\d\d$/, (d) => String(+d + 1)),
        NOON_ISH,
      ),
    );
  });

  it('treats past and too-soon slots as unavailable', () => {
    assert.ok(isSlotTooSoon('2026-10-05', '09:00', NOON_ISH));
    assert.ok(isSlotTooSoon('2026-10-05', '13:00', NOON_ISH));
    assert.ok(!isSlotTooSoon('2026-10-05', '13:30', NOON_ISH));
    assert.ok(!isSlotTooSoon('2026-10-06', '09:00', NOON_ISH));
    assert.ok(isSlotTooSoon('2026-10-04', '20:00', NOON_ISH));
  });

  it('marks booked and past slots unavailable', () => {
    const slots = slotsForDate('2026-10-05', new Set(['15:00']), NOON_ISH);
    const byTime = Object.fromEntries(slots.map((s) => [s.time, s.available]));
    assert.equal(byTime['12:00'], false);
    assert.equal(byTime['14:00'], true);
    assert.equal(byTime['15:00'], false);
  });
});

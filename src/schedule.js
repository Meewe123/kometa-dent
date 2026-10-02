/**
 * Planned-visit schedule. The clinic itself is open 24/7, but planned visits
 * (the ones you can book online) run from 09:00 to 21:00 in 30-minute slots.
 * Emergencies are handled by phone at any hour, without booking.
 */
export const CLINIC_TIME_ZONE = 'Asia/Tashkent';
export const FIRST_SLOT = '09:00';
export const LAST_SLOT = '20:30';
export const SLOT_MINUTES = 30;
/** How far ahead patients can book, including today. */
export const BOOKING_WINDOW_DAYS = 14;
/** A slot that starts sooner than this from now cannot be booked. */
export const MIN_LEAD_MINUTES = 30;

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export const ALL_SLOTS = (() => {
  const slots = [];
  for (let m = toMinutes(FIRST_SLOT); m <= toMinutes(LAST_SLOT); m += SLOT_MINUTES) {
    slots.push(toHHMM(m));
  }
  return Object.freeze(slots);
})();

const partsFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CLINIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Current date and time in the clinic's time zone, regardless of the server's zone. */
export function clinicNow(now = new Date()) {
  const p = Object.fromEntries(partsFormatter.formatToParts(now).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-30). */
export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dates patients can book, starting today in Tashkent. */
export function bookableDates(now = new Date()) {
  const { date } = clinicNow(now);
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(date, i));
}

export function isDateBookable(date, now = new Date()) {
  return bookableDates(now).includes(date);
}

/** A slot is in the past (or too soon) if it starts within MIN_LEAD_MINUTES from now. */
export function isSlotTooSoon(date, time, now = new Date()) {
  const current = clinicNow(now);
  if (date !== current.date) return date < current.date;
  return toMinutes(time) < current.minutes + MIN_LEAD_MINUTES;
}

/**
 * Slot list for a day with availability. `bookedTimes` is a Set of "HH:MM"
 * already taken by active (not cancelled) appointments.
 */
export function slotsForDate(date, bookedTimes, now = new Date()) {
  return ALL_SLOTS.map((time) => ({
    time,
    available: !bookedTimes.has(time) && !isSlotTooSoon(date, time, now),
  }));
}

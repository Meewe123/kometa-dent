import { SERVICE_IDS } from './catalog.js';
import { ALL_SLOTS, isDateBookable, isSlotTooSoon, isValidDate } from './schedule.js';

export const LIMITS = Object.freeze({ nameMin: 2, nameMax: 80, commentMax: 500 });

/**
 * Normalizes a phone number to E.164. Nine digits are treated as an Uzbek
 * number without the country code (+998); 10–15 digits as a full international
 * number. Returns null when the input cannot be a phone number.
 */
export function normalizePhone(raw) {
  if (typeof raw !== 'string' || !/^[\d\s()+-]+$/.test(raw.trim())) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  return null;
}

/** Collapses whitespace and strips control characters. */
function cleanText(value) {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

/**
 * Validates a booking request body. Returns `{ ok: true, value }` with
 * normalized fields, or `{ ok: false, errors }` where `errors` maps a field
 * name to a short code the client translates (required, invalid, too_long…).
 */
export function validateAppointment(body, now = new Date()) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const errors = {};
  const value = {};

  // name
  if (typeof input.name !== 'string' || !input.name.trim()) {
    errors.name = 'required';
  } else {
    const name = cleanText(input.name).replace(/\s+/g, ' ');
    if (name.length < LIMITS.nameMin) errors.name = 'too_short';
    else if (name.length > LIMITS.nameMax) errors.name = 'too_long';
    else value.name = name;
  }

  // phone
  if (typeof input.phone !== 'string' || !input.phone.trim()) {
    errors.phone = 'required';
  } else {
    const phone = normalizePhone(input.phone);
    if (phone) value.phone = phone;
    else errors.phone = 'invalid';
  }

  // service
  if (input.service === undefined || input.service === '') errors.service = 'required';
  else if (!SERVICE_IDS.includes(input.service)) errors.service = 'invalid';
  else value.service = input.service;

  // date
  if (input.date === undefined || input.date === '') errors.date = 'required';
  else if (!isValidDate(input.date)) errors.date = 'invalid';
  else if (!isDateBookable(input.date, now)) errors.date = 'unavailable';
  else value.date = input.date;

  // time
  if (input.time === undefined || input.time === '') errors.time = 'required';
  else if (!ALL_SLOTS.includes(input.time)) errors.time = 'invalid';
  else if (value.date && isSlotTooSoon(value.date, input.time, now)) errors.time = 'unavailable';
  else value.time = input.time;

  // comment (optional)
  if (input.comment === undefined || input.comment === null || input.comment === '') {
    value.comment = '';
  } else if (typeof input.comment !== 'string') {
    errors.comment = 'invalid';
  } else {
    const comment = cleanText(input.comment);
    if (comment.length > LIMITS.commentMax) errors.comment = 'too_long';
    else value.comment = comment;
  }

  // lang (optional, used to answer the patient in their language)
  value.lang = input.lang === 'uz' ? 'uz' : 'ru';

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export const STATUSES = Object.freeze(['pending', 'confirmed', 'cancelled']);

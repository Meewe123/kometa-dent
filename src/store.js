import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export class SlotTakenError extends Error {
  constructor() {
    super('This time slot is already booked');
    this.name = 'SlotTakenError';
  }
}

const isActive = (a) => a.status !== 'cancelled';

/**
 * Appointment storage. Data is kept in memory and written through to a JSON
 * file on every change (pass `file: null` for a memory-only store, used in
 * demo mode and tests).
 *
 * Writes go to a temporary file that is then renamed over the original, so a
 * crash mid-write cannot leave a half-written, unreadable file behind.
 * Node runs this code on a single thread and every method is synchronous, so
 * the "is the slot free?" check and the insert can't interleave with another
 * request. That guarantee holds for one process; running several instances
 * would need a real database with a unique index on (date, time).
 */
export function createStore({ file = null, seed = [] } = {}) {
  let data = { appointments: [] };

  if (file) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file)) {
      // Fail loudly on a corrupted file instead of silently starting empty.
      data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!Array.isArray(data.appointments)) data.appointments = [];
    } else {
      persist();
    }
  }
  data.appointments.push(...seed);

  function persist() {
    if (!file) return;
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  }

  function findConflict(date, time, exceptId) {
    return data.appointments.find(
      (a) => isActive(a) && a.date === date && a.time === time && String(a.id) !== exceptId,
    );
  }

  return {
    list() {
      return data.appointments.map((a) => ({ ...a }));
    },

    get(id) {
      const found = data.appointments.find((a) => String(a.id) === String(id));
      return found ? { ...found } : null;
    },

    bookedTimes(date) {
      return new Set(
        data.appointments.filter((a) => isActive(a) && a.date === date).map((a) => a.time),
      );
    },

    create(fields) {
      if (findConflict(fields.date, fields.time)) throw new SlotTakenError();
      const now = new Date().toISOString();
      const appointment = {
        id: randomUUID(),
        ...fields,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      data.appointments.push(appointment);
      try {
        persist();
      } catch (err) {
        data.appointments.pop();
        throw err;
      }
      return { ...appointment };
    },

    setStatus(id, status) {
      const appointment = data.appointments.find((a) => String(a.id) === String(id));
      if (!appointment) return null;
      if (
        status !== 'cancelled' &&
        appointment.status === 'cancelled' &&
        findConflict(appointment.date, appointment.time, String(appointment.id))
      ) {
        throw new SlotTakenError();
      }
      const previous = { status: appointment.status, updatedAt: appointment.updatedAt };
      appointment.status = status;
      appointment.updatedAt = new Date().toISOString();
      try {
        persist();
      } catch (err) {
        Object.assign(appointment, previous);
        throw err;
      }
      return { ...appointment };
    },
  };
}

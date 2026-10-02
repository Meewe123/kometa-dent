import { randomUUID } from 'node:crypto';

import { addDays, clinicNow } from './schedule.js';

// [day offset, time, name, service, status, comment]
const SAMPLE = [
  [0, '18:00', 'Азиз Т.', 'consultation', 'confirmed', ''],
  [0, '19:30', 'Malika R.', 'hygiene', 'pending', ''],
  [1, '09:30', 'Ольга В.', 'caries', 'confirmed', 'Болит нижний зуб слева при холодном'],
  [1, '10:00', 'Bobur S.', 'implants', 'pending', ''],
  [1, '14:30', 'Дилноза А.', 'whitening', 'cancelled', 'Перенесу на следующую неделю'],
  [2, '11:00', 'Тимур Н.', 'kids', 'pending', 'Ребёнку 6 лет, первый визит'],
  [2, '16:00', 'Sevara Q.', 'orthodontics', 'pending', ''],
  [4, '12:30', 'Игорь Л.', 'veneers', 'confirmed', ''],
];

/**
 * Fictional appointments for demo mode, placed relative to today so the
 * schedule always looks alive. Phones use the 99 operator prefix with zeros
 * so nobody real gets called by accident.
 */
export function demoAppointments(now = new Date()) {
  const today = clinicNow(now).date;
  return SAMPLE.map(([offset, time, name, service, status, comment], i) => {
    const createdAt = new Date(now.getTime() - (SAMPLE.length - i) * 3_600_000).toISOString();
    return {
      id: randomUUID(),
      name,
      phone: `+99899000000${i}`,
      service,
      date: addDays(today, offset),
      time,
      comment,
      lang: /[a-z]/i.test(name) ? 'uz' : 'ru',
      status,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

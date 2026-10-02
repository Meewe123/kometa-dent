import { createHash, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { isValidDate, isDateBookable, slotsForDate } from './schedule.js';
import { SlotTakenError } from './store.js';
import { formatAppointmentMessage } from './telegram.js';
import { STATUSES, validateAppointment } from './validation.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const sha256 = (value) => createHash('sha256').update(value).digest();

/** Constant-time token check, so response timing doesn't leak the token. */
function tokensMatch(given, expected) {
  return timingSafeEqual(sha256(given), sha256(expected));
}

function apiError(res, status, error, extra = {}) {
  return res.status(status).json({ ok: false, error, ...extra });
}

/**
 * Builds the Express app. Everything with side effects (storage, Telegram,
 * clock, logging) is passed in, so tests can run the real HTTP stack against
 * an in-memory store and a fake notifier.
 */
export function createApp({
  config,
  store,
  notifier,
  logger,
  serviceName,
  now = () => new Date(),
}) {
  const app = express();
  app.set('trust proxy', config.trustProxy);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Configured together with the HTML templates (inline script hashes).
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());

  const limiterDefaults = {
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) => apiError(res, 429, 'rate_limited'),
  };
  const bookingLimiter = rateLimit({ ...limiterDefaults, windowMs: 15 * 60_000, limit: 10 });
  const readLimiter = rateLimit({ ...limiterDefaults, windowMs: 60_000, limit: 120 });
  // Counts only failed requests: slows down token guessing without bothering staff.
  const adminLimiter = rateLimit({
    ...limiterDefaults,
    windowMs: 15 * 60_000,
    limit: 20,
    skipSuccessfulRequests: true,
  });

  app.get('/healthz', (req, res) => res.json({ ok: true }));

  // ── Public API ──────────────────────────────────────────────
  const api = express.Router();
  api.use(express.json({ limit: '10kb' }));

  api.get('/slots', readLimiter, (req, res) => {
    const { date } = req.query;
    if (!isValidDate(date)) return apiError(res, 400, 'invalid_date');
    if (!isDateBookable(date, now())) return res.json({ ok: true, date, slots: [] });
    res.json({ ok: true, date, slots: slotsForDate(date, store.bookedTimes(date), now()) });
  });

  api.post('/appointments', bookingLimiter, (req, res) => {
    // Honeypot: real people never see or fill the "website" field.
    if (req.body?.website) {
      logger.warn('appointment.honeypot', { ip: req.ip });
      return res.status(201).json({ ok: true });
    }

    const result = validateAppointment(req.body, now());
    if (!result.ok) return apiError(res, 400, 'validation', { fields: result.errors });

    let appointment;
    try {
      appointment = store.create(result.value);
    } catch (err) {
      if (err instanceof SlotTakenError) {
        return apiError(res, 409, 'slot_taken', { fields: { time: 'taken' } });
      }
      throw err;
    }

    logger.info('appointment.created', {
      id: appointment.id,
      service: appointment.service,
      date: appointment.date,
      time: appointment.time,
    });
    notifier.send(formatAppointmentMessage(appointment, { serviceName, siteUrl: config.siteUrl }));

    res.status(201).json({
      ok: true,
      appointment: { id: appointment.id, date: appointment.date, time: appointment.time },
    });
  });

  // ── Admin API ───────────────────────────────────────────────
  const admin = express.Router();
  admin.use(adminLimiter, (req, res, next) => {
    if (!config.adminToken) return apiError(res, 503, 'admin_disabled');
    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token || !tokensMatch(token, config.adminToken)) {
      logger.warn('admin.unauthorized', { ip: req.ip });
      return apiError(res, 401, 'unauthorized');
    }
    next();
  });

  admin.get('/appointments', (req, res) => {
    const appointments = store
      .list()
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    res.json({ ok: true, appointments });
  });

  admin.patch('/appointments/:id', (req, res) => {
    const status = req.body?.status;
    if (!STATUSES.includes(status)) return apiError(res, 400, 'invalid_status');
    try {
      const updated = store.setStatus(req.params.id, status);
      if (!updated) return apiError(res, 404, 'not_found');
      logger.info('appointment.status', { id: updated.id, status });
      res.json({ ok: true, appointment: updated });
    } catch (err) {
      if (err instanceof SlotTakenError) return apiError(res, 409, 'slot_taken');
      throw err;
    }
  });

  api.use('/admin', admin);
  api.use((req, res) => apiError(res, 404, 'not_found'));
  app.use('/api', api);

  // ── Static files and pages ──────────────────────────────────
  app.use(express.static(PUBLIC_DIR, { index: false, maxAge: '1h' }));
  app.get('/', (req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));
  app.use((req, res) => res.status(404).type('text/plain').send('Not found'));

  // ── Errors ──────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return apiError(res, 400, 'invalid_json');
    if (err.type === 'entity.too.large') return apiError(res, 413, 'too_large');
    logger.error('request.failed', { err, method: req.method, path: req.path });
    if (req.path.startsWith('/api/')) return apiError(res, 500, 'internal');
    res.status(500).type('text/plain').send('Internal error');
  });

  return app;
}

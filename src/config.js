import path from 'node:path';

const MIN_ADMIN_TOKEN_LENGTH = 16;

function parseBool(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase());
}

function parseIntOr(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Reads settings from environment variables once at startup.
 * Every value the app depends on lives here, so .env.example is the full list.
 */
export function loadConfig(env = process.env, argv = process.argv) {
  const demo = parseBool(env.DEMO_MODE) || argv.includes('--demo');
  const port = parseIntOr(env.PORT, 3000);

  let adminToken = (env.ADMIN_TOKEN ?? '').trim();
  if (!adminToken && demo) adminToken = 'demo';
  const adminTokenTooShort =
    !demo && adminToken.length > 0 && adminToken.length < MIN_ADMIN_TOKEN_LENGTH;

  // Render sets RENDER_EXTERNAL_URL itself, so a demo deploy needs no extra setup.
  const siteUrl = (env.SITE_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${port}`).replace(
    /\/+$/,
    '',
  );

  return {
    port,
    siteUrl,
    // HTTPS-only headers (HSTS, upgrade-insecure-requests) are sent only for an
    // HTTPS address, so the same build still works over plain HTTP locally.
    https: siteUrl.startsWith('https://'),
    demo,
    dataFile: demo ? null : path.resolve(env.DATA_DIR || 'data', 'appointments.json'),
    // An admin token that is too short is treated as "not set": the panel stays locked.
    adminToken: adminTokenTooShort ? '' : adminToken,
    adminTokenTooShort,
    telegram: demo
      ? null
      : env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
        ? { token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID }
        : null,
    trustProxy: parseIntOr(env.TRUST_PROXY, 0),
    logLevel: env.LOG_LEVEL || (env.NODE_ENV === 'test' ? 'silent' : 'info'),
  };
}

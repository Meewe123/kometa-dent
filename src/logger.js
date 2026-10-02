const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

/**
 * Minimal structured logger: one JSON object per line, easy to grep and to ship
 * to any log collector. Personal data (names, phones) must never be passed here.
 */
export function createLogger(level = 'info', write = (line) => process.stdout.write(line + '\n')) {
  const threshold = LEVELS[level] ?? LEVELS.info;

  function log(lvl, event, fields = {}) {
    if (LEVELS[lvl] < threshold) return;
    // Fixed keys go last so a field like `time` (an appointment slot) can't overwrite them.
    const entry = { ...fields, ts: new Date().toISOString(), level: lvl, event };
    if (fields.err instanceof Error) {
      entry.err = { message: fields.err.message, stack: fields.err.stack };
    }
    write(JSON.stringify(entry));
  }

  return {
    debug: (event, fields) => log('debug', event, fields),
    info: (event, fields) => log('info', event, fields),
    warn: (event, fields) => log('warn', event, fields),
    error: (event, fields) => log('error', event, fields),
  };
}

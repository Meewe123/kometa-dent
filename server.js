import { createApp } from './src/app.js';
import { loadConfig } from './src/config.js';
import { demoAppointments } from './src/demo.js';
import { serviceName } from './src/i18n/index.js';
import { createLogger } from './src/logger.js';
import { createStore } from './src/store.js';
import { createTelegramNotifier, nullNotifier } from './src/telegram.js';

const config = loadConfig();
const logger = createLogger(config.logLevel);

const store = createStore({
  file: config.dataFile,
  seed: config.demo ? demoAppointments() : [],
});
const notifier = config.telegram
  ? createTelegramNotifier({ ...config.telegram, logger })
  : nullNotifier;

const app = createApp({ config, store, notifier, logger, serviceName });

const server = app.listen(config.port, () => {
  logger.info('server.started', {
    url: `http://localhost:${config.port}`,
    demo: config.demo,
    storage: config.dataFile ?? 'memory',
    telegram: Boolean(config.telegram),
    admin: Boolean(config.adminToken),
  });
  if (config.adminTokenTooShort) {
    logger.warn('admin.token_too_short', { hint: 'ADMIN_TOKEN must be at least 16 characters' });
  }
});

function shutdown(signal) {
  logger.info('server.stopping', { signal });
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

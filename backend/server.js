require('dotenv').config();

const logger = require('./src/utils/logger');
const sequelize = require('./src/config/database.config');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const SHUTDOWN_GRACE_MS = Math.max(1000, Number.parseInt(process.env.SHUTDOWN_GRACE_MS, 10) || 25000);
let server;
let isDraining = false;

app.get('/health/ready', async (req, res) => {
  if (isDraining) {
    return res.status(503).json({ status: 'error', message: 'SDS Test System API is restarting' });
  }

  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: 'success', message: 'SDS Test System API is ready' });
  } catch (_) {
    return res.status(503).json({ status: 'error', message: 'SDS Test System database is unavailable' });
  }
});

const closeHttpServer = () => new Promise((resolve) => {
  if (!server) {
    resolve();
    return;
  }

  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(forceCloseTimer);
    resolve();
  };
  const forceCloseTimer = setTimeout(() => {
    logger.warn({ actionType: 'SYSTEM', message: 'Shutdown grace period elapsed; closing remaining HTTP connections' });
    server.closeAllConnections?.();
    finish();
  }, SHUTDOWN_GRACE_MS);

  server.close(finish);
  server.closeIdleConnections?.();
});

const shutdown = async (signal, error) => {
  if (isDraining) return;
  isDraining = true;
  if (error) {
    logger.error({ actionType: 'SYSTEM', message: `${signal}: ${error.message}`, details: { stack: error.stack } });
  } else {
    logger.info({ actionType: 'SYSTEM', message: `Received ${signal}, shutting down gracefully` });
  }
  try {
    await closeHttpServer();
    await sequelize.close();
  } finally {
    process.exit(error ? 1 : 0);
  }
};

const start = async () => {
  try {
    // Phase 1: Critical pre-logger setup
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    // Phase 2: Main sync
    // await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    // logger.info('✅ Database models synchronized');

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error({ actionType: 'STARTUP_FAILED', message: 'Failed to start server', details: { error: error.message, stack: error.stack } });
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => shutdown('uncaughtException', error));
process.on('unhandledRejection', (reason) => shutdown('unhandledRejection', reason instanceof Error ? reason : new Error(String(reason))));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

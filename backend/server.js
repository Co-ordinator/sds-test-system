const logger = require('./src/utils/logger');
const sequelize = require('./src/config/database.config');
const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    // Phase 1: Critical pre-logger setup
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    // Phase 2: Main sync
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    logger.info('✅ Database models synchronized');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error({ actionType: 'STARTUP_FAILED', message: 'Failed to start server', details: { error: error.message, stack: error.stack } });
    process.exit(1);
  }
};

start();

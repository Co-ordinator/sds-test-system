const sequelize = require('./database');
const logger = require('../utils/logger');

const setupDatabase = async () => {
  try {
    // Phase 1: Critical pre-logger setup
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Phase 2: Main sync
    await sequelize.sync({ force: process.env.NODE_ENV === 'development', alter: true });
    console.log('✅ Database models synchronized');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (logger) {
      logger.error({
        actionType: 'SETUP_FAILURE',
        message: 'Database initialization failed',
        error: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

module.exports = setupDatabase;

const { Sequelize } = require('sequelize');
const config = require('./config');

const isTest = process.env.NODE_ENV === 'test';
let connectionUrl = null;
if (isTest && process.env.TEST_DATABASE_URL) {
  connectionUrl = process.env.TEST_DATABASE_URL;
} else if (process.env.DATABASE_URL) {
  // Use as-is if URL already has a path (e.g. .../sds_test_db), else append database name
  const url = process.env.DATABASE_URL;
  const dbName = config.db.database || 'sds_test_db';
  connectionUrl = /\/[^/]+\/?$/.test(url) ? url.replace(/\/?$/, '') : `${url.replace(/\/?$/, '')}/${dbName}`;
}

const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
      config.db.database,
      config.db.username,
      config.db.password,
      {
        host: config.db.host,
        dialect: 'postgres',
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
      }
    );

// Test connection (skip in automated tests to speed up and avoid noisy output)
const testConnection = async () => {
  if (isTest) return;
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
  }
};

testConnection();

module.exports = sequelize;

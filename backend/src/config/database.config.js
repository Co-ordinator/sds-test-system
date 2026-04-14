const { Sequelize } = require('sequelize');
const config = require('./config');

const isTest = process.env.NODE_ENV === 'test';
const shouldUseSSL = (() => {
  if (process.env.DB_SSL === 'true') return true;
  if (process.env.DB_SSL === 'false') return false;
  const host = (process.env.DB_HOST || '').toLowerCase();
  const url = (process.env.DATABASE_URL || '').toLowerCase();
  return host.includes('render.com') || url.includes('render.com') || process.env.NODE_ENV === 'production';
})();
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
const sequelizeOptions = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(shouldUseSSL ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: sslRejectUnauthorized } } } : {}),
};

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
  ? new Sequelize(connectionUrl, sequelizeOptions)
  : new Sequelize(
      config.db.database,
      config.db.username,
      config.db.password,
      { ...sequelizeOptions, host: config.db.host }
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

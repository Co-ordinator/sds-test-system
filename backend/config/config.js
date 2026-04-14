require('dotenv').config();

const useSSL = process.env.DB_SSL === 'true';
const sslRejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
const sslDialectOptions = useSSL
  ? { ssl: { require: true, rejectUnauthorized: sslRejectUnauthorized } }
  : undefined;

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'sds_test_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    ...(sslDialectOptions ? { dialectOptions: sslDialectOptions } : {}),
    logging: false
  },
  test: {
    username: process.env.TEST_DB_USER || process.env.DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD ?? process.env.DB_PASSWORD ?? '',
    database: process.env.TEST_DB_NAME || 'sds_test_db_test',
    host: process.env.TEST_DB_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    ...(sslDialectOptions ? { dialectOptions: sslDialectOptions } : {}),
    logging: false
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    logging: false
  }
};

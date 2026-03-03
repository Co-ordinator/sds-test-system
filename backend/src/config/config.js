require('dotenv').config();

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'sds_test_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  }
};

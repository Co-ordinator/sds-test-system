require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Client } = require('pg');

const dbName = process.env.DB_NAME || 'sds_test_db';

async function resetDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres'
  });
  try {
    await client.connect();
    
    // Terminate existing connections
    await client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid()
    `, [dbName]);
    
    // Drop database
    await client.query(`DROP DATABASE IF EXISTS "${dbName}"`);
    console.log(`Database "${dbName}" dropped.`);
    
    // Create database
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created successfully.`);
  } catch (err) {
    console.error('Error resetting database:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

resetDb();

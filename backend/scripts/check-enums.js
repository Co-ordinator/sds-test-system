const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function checkEnums() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database\n');

    // Check all enum types
    const [results] = await sequelize.query(`
      SELECT n.nspname as schema, t.typname as name, e.enumlabel as value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname LIKE 'enum_users_%'
      ORDER BY t.typname, e.enumsortorder;
    `);

    console.log('Current enum types:');
    console.log(JSON.stringify(results, null, 2));
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkEnums();

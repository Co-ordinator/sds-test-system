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
    logging: false
  }
);

async function dropUserEnums() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Drop all user-related enum types
    await sequelize.query('DROP TYPE IF EXISTS enum_users_role CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_user_type CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_gender CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_region CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_employment_status CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_preferred_language CASCADE');
    
    console.log('Dropped all user enum types');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropUserEnums();

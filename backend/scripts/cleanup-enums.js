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

async function cleanupEnums() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Drop old enum types if they exist
    await sequelize.query('DROP TYPE IF EXISTS enum_users_role_old CASCADE');
    await sequelize.query('DROP TYPE IF EXISTS enum_users_user_type_old CASCADE');
    
    console.log('Cleaned up old enum types');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanupEnums();

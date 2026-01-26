// backend/scripts/setup.js
const { sequelize } = require('../src/models');
const { seedDatabase } = require('../src/seeders');

const run = async () => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   SDS TEST SYSTEM - DATABASE SETUP');
    console.log('   Ministry of Labour and Social Security');
    console.log('   Kingdom of Eswatini');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');
    
    // Sync models (creates tables)
    console.log('🔧 Creating database tables...');
    await sequelize.sync({ force: true }); // WARNING: Drops existing tables!
    console.log('✅ Database tables created\n');
    
    // Seed data
    console.log('🌱 Seeding database with Ministry of Labour data...\n');
    await seedDatabase();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ✨ SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 What was created:');
    console.log('   • 12 Database tables');
    console.log('   • 1 Complete SDS test (228 questions)');
    console.log('   • 35+ Occupations with Holland codes');
    console.log('   • 5 Eswatini institutions');
    console.log('   • 3 Test user accounts\n');
    
    console.log('🔐 Test Accounts:');
    console.log('   Admin:     admin@labor.gov.sz / Admin@123');
    console.log('   Counselor: counselor@labor.gov.sz / Counselor@123');
    console.log('   Student:   student@test.sz / Student@123\n');
    
    console.log('🚀 Next steps:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Start the frontend: cd ../frontend && npm start');
    console.log('   3. Visit http://localhost:3000\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your .env file has correct database credentials');
    console.error('   2. Ensure PostgreSQL is running: sudo service postgresql status');
    console.error('   3. Verify database exists: psql -U postgres -d sds_test_db');
    console.error('\nFull error:', error);
    process.exit(1);
  }
};

run();
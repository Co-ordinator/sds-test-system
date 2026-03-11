/**
 * seed-all.js
 * Runs all CLI-style seeders in timestamp order without requiring sequelize-cli.
 * Usage: node scripts/seed-all.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const path = require('path');
const fs   = require('fs');
const sequelize = require('../src/config/database.config');

async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   SDS TEST SYSTEM — SEED ALL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await sequelize.authenticate();
  console.log('✅ Database connection OK\n');

  // Ensure all model-defined tables exist (creates missing ones, preserves existing data)
  console.log('🔧 Syncing models (creating missing tables)...');
  // Require models so they register on the sequelize instance
  require('../src/models');
  await sequelize.sync({ alter: false });
  console.log('✅ Tables ready\n');

  const queryInterface = sequelize.getQueryInterface();

  const seedersDir = path.resolve(__dirname, '../seeders');
  const files = fs.readdirSync(seedersDir)
    .filter(f => f.endsWith('.js'))
    .sort(); // Alphabetical = chronological given timestamp filenames

  console.log(`Found ${files.length} seeder files:\n`);
  files.forEach(f => console.log(`  • ${f}`));
  console.log('');

  for (const file of files) {
    const seedPath = path.join(seedersDir, file);
    const seeder   = require(seedPath);

    process.stdout.write(`▶  Running: ${file} ... `);
    try {
      await seeder.up(queryInterface, sequelize.constructor);
      console.log('✅ done');
    } catch (err) {
      if (
        err.message && (
          err.message.includes('duplicate key') ||
          err.message.includes('already exists') ||
          err.message.includes('unique constraint') ||
          err.message.includes('unique violation')
        )
      ) {
        console.log('⚠️  skipped (data already exists)');
      } else {
        console.error(`❌ FAILED\n   ${err.message}`);
        console.error(err.stack);
        process.exit(1);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ✨ ALL SEEDERS COMPLETE!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔐 Login Credentials:');
  console.log('   Admin:         admin@labor.gov.sz           / Admin@123');
  console.log('   Counselor 1:   counselor1@labor.gov.sz      / Counselor@123');
  console.log('   Counselor 2:   counselor2@labor.gov.sz      / Counselor@123');
  console.log('   Counselor 3:   counselor3@labor.gov.sz      / Counselor@123');
  console.log('   School Std:    username=20250101..20250301  / Pass@2025');
  console.log('   Uni Student:   zanele.motsa@...             / Student@123');
  console.log('   Professional:  mandla.dlamini@gmail.com     / Professional@123');
  console.log('   Demo:          student@test.sz              / Student@123\n');

  await sequelize.close();
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

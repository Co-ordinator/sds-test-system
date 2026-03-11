require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const sequelize = require('../src/config/database.config');

const tables = [
  'education_levels', 'institutions', 'users', 'questions',
  'occupations', 'assessments', 'answers', 'school_students',
  'courses', 'course_requirements', 'course_institutions', 'audit_logs'
];

async function verify() {
  await sequelize.authenticate();
  for (const t of tables) {
    const [rows] = await sequelize.query(`SELECT COUNT(*) AS cnt FROM "${t}"`);
    console.log(`  ${t.padEnd(26)} ${rows[0].cnt}`);
  }
  await sequelize.close();
}

verify().catch(e => { console.error(e.message); process.exit(1); });

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

async function verifySetup() {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection successful\n');

    // Check tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    console.log(`✓ Found ${tables.length} tables`);

    // Check users
    const [users] = await sequelize.query('SELECT role, user_type, COUNT(*) as count FROM users GROUP BY role, user_type ORDER BY role, user_type');
    console.log('\n✓ Users by role and type:');
    users.forEach(u => console.log(`  - ${u.role} (${u.user_type || 'N/A'}): ${u.count}`));

    // Check permissions
    const [permissions] = await sequelize.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`\n✓ Permissions: ${permissions[0].count}`);

    // Check user_permissions
    const [userPerms] = await sequelize.query(`
      SELECT u.username, COUNT(up.permission_id) as perm_count 
      FROM users u 
      LEFT JOIN user_permissions up ON u.id = up.user_id 
      WHERE u.role IN ('System Administrator', 'Test Administrator')
      GROUP BY u.username
      ORDER BY u.username
    `);
    console.log('\n✓ Admin/Test Administrator permissions:');
    userPerms.forEach(up => console.log(`  - ${up.username}: ${up.perm_count} permissions`));

    // Check other seeded data
    const [questions] = await sequelize.query('SELECT COUNT(*) as count FROM questions');
    const [institutions] = await sequelize.query('SELECT COUNT(*) as count FROM institutions');
    const [courses] = await sequelize.query('SELECT COUNT(*) as count FROM courses');
    const [occupations] = await sequelize.query('SELECT COUNT(*) as count FROM occupations');
    const [subjects] = await sequelize.query('SELECT COUNT(*) as count FROM subjects');

    console.log('\n✓ Seeded data:');
    console.log(`  - Questions: ${questions[0].count}`);
    console.log(`  - Institutions: ${institutions[0].count}`);
    console.log(`  - Courses: ${courses[0].count}`);
    console.log(`  - Occupations: ${occupations[0].count}`);
    console.log(`  - Subjects: ${subjects[0].count}`);

    console.log('\n✅ Database setup verified successfully!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifySetup();

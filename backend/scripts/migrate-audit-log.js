// One-off migration: change audit_logs.action_type from ENUM to VARCHAR(100)
const { sequelize } = require('../src/models');

const run = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');

    await sequelize.query(
      `ALTER TABLE audit_logs ALTER COLUMN action_type TYPE VARCHAR(100) USING action_type::VARCHAR;`
    );
    console.log('Column type changed to VARCHAR(100).');

    await sequelize.query(`DROP TYPE IF EXISTS "enum_audit_logs_action_type";`);
    console.log('Old ENUM type dropped (if existed).');

    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
};

run();

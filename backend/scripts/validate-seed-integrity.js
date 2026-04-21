require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const allConfigs = require('../config/config');

const createSequelize = (cfg) => {
  const runtimeConfig = { ...cfg };
  if (process.env.NODE_ENV === 'test' && process.env.TEST_DB_SSL !== 'true') {
    delete runtimeConfig.dialectOptions;
  }
  return new Sequelize(runtimeConfig.database, runtimeConfig.username, runtimeConfig.password, runtimeConfig);
};

async function validateSeedIntegrity() {
  const primaryConfig = process.env.NODE_ENV === 'test' ? allConfigs.test : allConfigs.development;
  const fallbackConfig = allConfigs.development;
  let sequelize = createSequelize(primaryConfig);
  const errors = [];

  const assertCount = (name, count, min) => {
    if (Number(count) < min) {
      errors.push(`${name} expected >= ${min} rows, found ${count}`);
    }
  };

  try {
    try {
      await sequelize.authenticate();
    } catch (error) {
      const shouldFallback =
        process.env.NODE_ENV === 'test' &&
        primaryConfig !== fallbackConfig &&
        /does not exist/i.test(error.message || '');
      if (!shouldFallback) throw error;
      await sequelize.close();
      sequelize = createSequelize(fallbackConfig);
      await sequelize.authenticate();
    }

    const [counts] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*) FROM institutions) AS institutions,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM questions) AS questions,
        (SELECT COUNT(*) FROM subjects) AS subjects,
        (SELECT COUNT(*) FROM courses) AS courses,
        (SELECT COUNT(*) FROM course_institutions) AS course_institutions,
        (SELECT COUNT(*) FROM permissions) AS permissions
    `);
    const c = counts[0];
    assertCount('institutions', c.institutions, 40);
    assertCount('users', c.users, 1);
    assertCount('questions', c.questions, 228);
    assertCount('subjects', c.subjects, 25);
    assertCount('courses', c.courses, 30);
    assertCount('course_institutions', c.course_institutions, 1);
    assertCount('permissions', c.permissions, 10);

    const [missingLinks] = await sequelize.query(`
      SELECT COUNT(*) AS cnt
      FROM course_institutions ci
      LEFT JOIN courses c ON c.id = ci.course_id
      LEFT JOIN institutions i ON i.id = ci.institution_id
      WHERE c.id IS NULL OR i.id IS NULL
    `);
    if (Number(missingLinks[0].cnt) > 0) {
      errors.push(`course_institutions has ${missingLinks[0].cnt} orphaned links`);
    }

    const [missingPermissions] = await sequelize.query(`
      SELECT COUNT(*) AS cnt
      FROM users u
      LEFT JOIN user_permissions up ON up.user_id = u.id
      WHERE u.role IN ('System Administrator', 'Test Administrator')
      GROUP BY u.id
      HAVING COUNT(up.permission_id) = 0
    `);
    if (missingPermissions.length > 0) {
      errors.push('some admin/test-admin users have zero permissions assigned');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    return { ok: true };
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  validateSeedIntegrity()
    .then(() => {
      console.log('Seed integrity validation passed.');
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { validateSeedIntegrity };

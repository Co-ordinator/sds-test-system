const { validateSeedIntegrity } = require('../scripts/validate-seed-integrity');
const { execSync } = require('child_process');
const path = require('path');

describe('DB bootstrap integrity', () => {
  test('seeded data passes integrity checks', async () => {
    const backendRoot = path.resolve(__dirname, '..');
    const originalEnv = {
      NODE_ENV: process.env.NODE_ENV,
      DB_SSL: process.env.DB_SSL,
      DB_SSL_REJECT_UNAUTHORIZED: process.env.DB_SSL_REJECT_UNAUTHORIZED
    };

    process.env.NODE_ENV = 'development';
    process.env.DB_SSL = 'false';
    process.env.DB_SSL_REJECT_UNAUTHORIZED = 'false';

    const env = {
      ...process.env,
      NODE_ENV: 'development',
      DB_SSL: 'false',
      DB_SSL_REJECT_UNAUTHORIZED: 'false'
    };

    try {
      try {
        await expect(validateSeedIntegrity()).resolves.toEqual({ ok: true });
        return;
      } catch (_) {
        // DB is not fully seeded yet; run the core seeders required for integrity checks.
      }

      const requiredSeeders = [
        '20260301000001-seed-subjects.js',
        '20260301000002-seed-all-institutions.js',
        '20260301000003-seed-users.js',
        '20260301000004-seed-school-students.js',
        '20260301000005-seed-all-courses.js',
        '20260301000006-seed-questions.js',
        '20260301000007-seed-permissions.js',
        '20260301000008-seed-occupations.js'
      ];

      for (const seeder of requiredSeeders) {
        execSync(`npx sequelize-cli db:seed --seed ${seeder}`, {
          cwd: backendRoot,
          stdio: 'pipe',
          env
        });
      }

      await expect(validateSeedIntegrity()).resolves.toEqual({ ok: true });
    } finally {
      process.env.NODE_ENV = originalEnv.NODE_ENV;
      process.env.DB_SSL = originalEnv.DB_SSL;
      process.env.DB_SSL_REJECT_UNAUTHORIZED = originalEnv.DB_SSL_REJECT_UNAUTHORIZED;
    }
  }, 180000);
});

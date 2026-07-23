'use strict';

const migration = require('../migrations/20260710110000-add-certificate-profile-snapshot-to-assessments');

describe('certificate profile snapshot migration', () => {
  const Sequelize = { JSONB: Symbol('JSONB') };

  test('adds a nullable JSONB column without backfilling existing assessments', async () => {
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ id: {} }),
      addColumn: jest.fn().mockResolvedValue(),
      removeColumn: jest.fn()
    };

    await migration.up(queryInterface, Sequelize);

    expect(queryInterface.addColumn).toHaveBeenCalledWith(
      'assessments',
      'certificate_profile_snapshot',
      expect.objectContaining({
        type: Sequelize.JSONB,
        allowNull: true
      })
    );
    expect(queryInterface).not.toHaveProperty('bulkUpdate');
  });

  test('is safe to rerun and removes only its own column on rollback', async () => {
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ certificate_profile_snapshot: {} }),
      addColumn: jest.fn(),
      removeColumn: jest.fn().mockResolvedValue()
    };

    await migration.up(queryInterface, Sequelize);
    expect(queryInterface.addColumn).not.toHaveBeenCalled();

    await migration.down(queryInterface);
    expect(queryInterface.removeColumn).toHaveBeenCalledWith(
      'assessments',
      'certificate_profile_snapshot'
    );
  });
});

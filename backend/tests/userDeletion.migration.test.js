'use strict';

const migration = require('../migrations/20260711190000-purge-soft-deleted-users');

describe('soft-deleted user purge migration', () => {
  it('permanently removes existing deleted account graphs', async () => {
    const query = jest.fn(async (sql) => (
      sql.includes('SELECT uq.file_path') ? [[], {}] : [[], {}]
    ));
    const transaction = jest.fn(async (callback) => callback({ id: 'transaction-1' }));
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ deleted_at: {} }),
      sequelize: { query, transaction }
    };

    await migration.up(queryInterface);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DELETE FROM certificates');
    expect(sql).toContain('DELETE FROM answers');
    expect(sql).toContain('DELETE FROM audit_logs');
    expect(sql).toContain('DELETE FROM assessments');
    expect(sql).toContain('DELETE FROM users WHERE deleted_at IS NOT NULL');
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});

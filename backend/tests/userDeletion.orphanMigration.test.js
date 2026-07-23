'use strict';

const migration = require('../migrations/20260711191000-purge-orphaned-user-data');

describe('orphaned user-data purge migration', () => {
  it('removes historical rows whose users no longer exist', async () => {
    const query = jest.fn().mockResolvedValue([[], {}]);
    const transaction = jest.fn(async (callback) => callback({ id: 'transaction-1' }));
    const queryInterface = { sequelize: { query, transaction } };

    await migration.up(queryInterface);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DELETE FROM certificates');
    expect(sql).toContain('DELETE FROM answers');
    expect(sql).toContain('DELETE FROM audit_logs');
    expect(sql).toContain('DELETE FROM assessments');
    expect(sql).toContain('user_id NOT IN (SELECT id FROM users)');
  });
});

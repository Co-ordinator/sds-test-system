'use strict';

jest.mock('../src/models', () => ({
  User: {
    sequelize: {
      query: jest.fn(),
      transaction: jest.fn()
    }
  }
}));

const { User } = require('../src/models');
const {
  permanentlyDeleteUser,
  permanentlyDeleteUsers
} = require('../src/services/userDeletion.service');

describe('permanent user deletion', () => {
  const transaction = { id: 'transaction-1' };

  beforeEach(() => {
    jest.clearAllMocks();
    User.sequelize.transaction.mockImplementation(async (callback) => callback(transaction));
    User.sequelize.query.mockImplementation(async (sql) => {
      if (sql.includes('SELECT id, email, role')) {
        return [[{ id: 'user-1', email: 'old@example.com', role: 'Test Taker' }], {}];
      }
      if (sql.includes('SELECT file_path')) return [[], {}];
      return [[], {}];
    });
  });

  it('removes the complete user-owned database graph', async () => {
    const result = await permanentlyDeleteUsers(['user-1']);

    expect(result.deleted).toBe(1);
    const statements = User.sequelize.query.mock.calls.map(([sql]) => sql).join('\n');
    expect(statements).toContain('DELETE FROM certificates');
    expect(statements).toContain('DELETE FROM answers');
    expect(statements).toContain('DELETE FROM audit_logs');
    expect(statements).toContain('DELETE FROM user_qualifications');
    expect(statements).toContain('DELETE FROM assessments');
    expect(statements).toContain('DELETE FROM users');
    expect(statements).toContain('UPDATE institutions SET submitted_by = NULL');
  });

  it('returns the pre-delete snapshot needed by the deletion audit event', async () => {
    await expect(permanentlyDeleteUser('user-1')).resolves.toEqual(expect.objectContaining({
      snapshot: {
        id: 'user-1',
        email: 'old@example.com',
        role: 'Test Taker'
      }
    }));
  });
});

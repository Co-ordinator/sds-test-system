'use strict';

jest.mock('../src/models', () => ({
  User: {},
  AuditLog: {},
  Assessment: {},
  Institution: {}
}));

jest.mock('../src/services/scoring.service', () => ({
  getAssessmentDisplayCode: jest.fn()
}));

jest.mock('../src/services/userDeletion.service', () => ({
  permanentlyDeleteUser: jest.fn(),
  permanentlyDeleteUsers: jest.fn()
}));

const {
  permanentlyDeleteUser,
  permanentlyDeleteUsers
} = require('../src/services/userDeletion.service');
const adminService = require('../src/services/admin.service');

describe('administrator user deletion', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses permanent deletion for a single user', async () => {
    const deleted = { snapshot: { id: 'user-1' } };
    permanentlyDeleteUser.mockResolvedValue(deleted);

    await expect(adminService.deleteUser('user-1')).resolves.toBe(deleted);
    expect(permanentlyDeleteUser).toHaveBeenCalledWith('user-1');
  });

  it('permanently deletes bulk selections while excluding the acting administrator', async () => {
    permanentlyDeleteUsers.mockResolvedValue({ deleted: 2 });

    await expect(adminService.bulkDeleteUsers(
      ['user-1', 'admin-1', 'user-2'],
      'admin-1'
    )).resolves.toBe(2);

    expect(permanentlyDeleteUsers).toHaveBeenCalledWith(
      ['user-1', 'admin-1', 'user-2'],
      { excludeUserId: 'admin-1' }
    );
  });
});

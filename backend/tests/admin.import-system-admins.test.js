const adminService = require('../src/services/admin.service');

describe('Admin system-admin CSV import', () => {
  test('rejects empty csv payload', async () => {
    await expect(adminService.importSystemAdmins('')).rejects.toMatchObject({
      code: 'CSV_REQUIRED'
    });
  });
});

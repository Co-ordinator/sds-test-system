'use strict';

const mockFindAll = jest.fn();
const mockCount = jest.fn();
const mockFindByPk = jest.fn();
const mockQuery = jest.fn();
const mockLiteral = jest.fn((sql) => ({ sql }));

jest.mock('../src/models', () => ({
  User: {},
  Assessment: {},
  Institution: {},
  AuditLog: {
    findAll: mockFindAll,
    count: mockCount,
    findByPk: mockFindByPk,
    sequelize: {
      literal: mockLiteral,
      query: mockQuery
    }
  }
}));
jest.mock('../src/services/scoring.service', () => ({
  getAssessmentDisplayCode: jest.fn()
}));
jest.mock('../src/services/userDeletion.service', () => ({
  permanentlyDeleteUser: jest.fn(),
  permanentlyDeleteUsers: jest.fn()
}));

const adminService = require('../src/services/admin.service');

describe('admin notification service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('uses an efficient unread count query', async () => {
    mockFindAll.mockResolvedValue([{ id: 'notification-1' }]);
    mockCount.mockResolvedValue(4);

    const result = await adminService.getNotifications(1);

    expect(result.unreadCount).toBe(4);
    expect(mockFindAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
    expect(mockCount).toHaveBeenCalledTimes(1);
    expect(mockLiteral).toHaveBeenCalledWith(expect.stringContaining("details->>'isRead'"));
  });

  test('marks all unread notifications in one idempotent update', async () => {
    mockQuery.mockResolvedValueOnce([[], { rowCount: 3 }]);
    await expect(adminService.markAllNotificationsRead()).resolves.toBe(3);

    mockQuery.mockResolvedValueOnce([[], { rowCount: 0 }]);
    await expect(adminService.markAllNotificationsRead()).resolves.toBe(0);
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining("action_type = 'ASSESSMENT_COMPLETED_NOTIFY'"));
  });

  test('marks one notification read without replacing existing details', async () => {
    const log = {
      details: { assessmentId: 'assessment-1' },
      update: jest.fn().mockResolvedValue(undefined)
    };
    mockFindByPk.mockResolvedValue(log);

    await adminService.markNotificationRead('notification-1');

    expect(log.update).toHaveBeenCalledWith({
      details: { assessmentId: 'assessment-1', isRead: true }
    });
  });
});

'use strict';

const jwt = require('jsonwebtoken');

const mockUserFindOne = jest.fn();
const mockUserFindByPk = jest.fn();
const mockSessionCreate = jest.fn();
const mockSessionDestroy = jest.fn();
const mockSessionUpdate = jest.fn();
const mockSessionFindOne = jest.fn();

jest.mock('../src/models', () => ({
  User: {
    findOne: mockUserFindOne,
    findByPk: mockUserFindByPk
  },
  AuthSession: {
    create: mockSessionCreate,
    destroy: mockSessionDestroy,
    update: mockSessionUpdate,
    findOne: mockSessionFindOne
  },
  EducationLevel: {},
  Occupation: {},
  Institution: {},
  Permission: {}
}));

jest.mock('../src/utils/generateStudentCode', () => ({
  generateStudentCode: jest.fn()
}));

jest.mock('../src/services/userDeletion.service', () => ({
  permanentlyDeleteUser: jest.fn()
}));

describe('per-device authentication sessions', () => {
  let authService;
  let user;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRE = '15m';
    authService = require('../src/services/auth.service');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    user = {
      id: '8b3db25b-5af5-40d8-8cef-bf2e97da7a61',
      role: 'System Administrator',
      email: 'admin@example.com',
      isEmailVerified: true,
      createdByTestAdministrator: false,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      mustChangePassword: false,
      refreshToken: 'legacy-token-remains-until-migrated',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      toJSON: jest.fn(() => ({ id: '8b3db25b-5af5-40d8-8cef-bf2e97da7a61' }))
    };
    mockUserFindOne.mockResolvedValue(user);
    mockUserFindByPk.mockResolvedValue(user);
    mockSessionCreate.mockResolvedValue({});
    mockSessionDestroy.mockResolvedValue(0);
    mockSessionUpdate.mockResolvedValue([1]);
    mockSessionFindOne.mockResolvedValue(null);
  });

  test('two logins create independent refresh sessions', async () => {
    const first = await authService.login('admin@example.com', 'secret');
    const second = await authService.login('admin@example.com', 'secret');

    expect(first.refreshToken).not.toBe(second.refreshToken);
    expect(mockSessionCreate).toHaveBeenCalledTimes(2);

    const firstSession = jwt.verify(first.refreshToken, process.env.JWT_REFRESH_SECRET).sid;
    const secondSession = jwt.verify(second.refreshToken, process.env.JWT_REFRESH_SECRET).sid;
    expect(firstSession).toBeTruthy();
    expect(secondSession).toBeTruthy();
    expect(firstSession).not.toBe(secondSession);
    expect(user.refreshToken).toBe('legacy-token-remains-until-migrated');
  });

  test('each device token refreshes only its own session row', async () => {
    const first = await authService.login('admin@example.com', 'secret');
    const second = await authService.login('admin@example.com', 'secret');
    const firstSession = jwt.verify(first.refreshToken, process.env.JWT_REFRESH_SECRET).sid;
    const secondSession = jwt.verify(second.refreshToken, process.env.JWT_REFRESH_SECRET).sid;

    await expect(authService.refreshAccessToken(first.refreshToken))
      .resolves.toMatchObject({ newRefreshToken: expect.any(String) });
    await expect(authService.refreshAccessToken(second.refreshToken))
      .resolves.toMatchObject({ newRefreshToken: expect.any(String) });

    expect(mockSessionUpdate.mock.calls[0][1].where.id).toBe(firstSession);
    expect(mockSessionUpdate.mock.calls[1][1].where.id).toBe(secondSession);
  });

  test('logout removes only the presented device session', async () => {
    const login = await authService.login('admin@example.com', 'secret');
    mockSessionDestroy.mockClear();
    mockSessionDestroy.mockResolvedValue(1);

    await authService.logout(login.refreshToken);

    expect(mockSessionDestroy).toHaveBeenCalledTimes(1);
    expect(mockUserFindOne).toHaveBeenCalledTimes(1);
  });
});

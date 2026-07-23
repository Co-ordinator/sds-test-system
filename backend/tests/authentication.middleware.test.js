'use strict';

const mockVerify = jest.fn();

jest.mock('jsonwebtoken', () => ({
  verify: mockVerify
}));

jest.mock('../src/models', () => ({
  AuditLog: { create: jest.fn() },
  User: { findByPk: jest.fn() }
}));

const { verifyToken } = require('../src/middleware/authentication.middleware');

describe('authentication middleware token errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('classifies a missing access cookie as routine unauthenticated state', () => {
    const next = jest.fn();
    verifyToken({ headers: {}, cookies: {} }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      status: 401,
      code: 'ACCESS_TOKEN_MISSING'
    }));
  });

  test('classifies an expired access token separately from a malformed token', () => {
    mockVerify.mockImplementation(() => {
      const error = new Error('expired');
      error.name = 'TokenExpiredError';
      throw error;
    });
    const next = jest.fn();
    verifyToken({ headers: {}, cookies: { accessToken: 'expired' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      status: 401,
      code: 'ACCESS_TOKEN_EXPIRED'
    }));
  });

  test('keeps malformed token failures visible as invalid-token warnings', () => {
    mockVerify.mockImplementation(() => {
      throw new Error('bad signature');
    });
    const next = jest.fn();
    verifyToken({ headers: {}, cookies: { accessToken: 'malformed' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({
      status: 401,
      code: 'INVALID_ACCESS_TOKEN'
    }));
  });
});

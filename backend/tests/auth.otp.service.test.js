'use strict';

const crypto = require('crypto');

const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockFindByPk = jest.fn();
const mockGenerateStudentCode = jest.fn();
const mockAuthSessionCreate = jest.fn();
const mockAuthSessionDestroy = jest.fn();

jest.mock('../src/models', () => ({
  User: {
    findOne: mockFindOne,
    create: mockCreate,
    findByPk: mockFindByPk
  },
  AuthSession: {
    create: mockAuthSessionCreate,
    destroy: mockAuthSessionDestroy,
    update: jest.fn(),
    findOne: jest.fn()
  },
  EducationLevel: {},
  Occupation: {},
  Institution: {},
  Permission: {}
}));

jest.mock('../src/utils/generateStudentCode', () => ({
  generateStudentCode: mockGenerateStudentCode
}));

jest.mock('../src/services/userDeletion.service', () => ({
  permanentlyDeleteUser: jest.fn()
}));

describe('auth OTP helpers', () => {
  let authService;
  const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');
  const makeMutableUser = (overrides = {}) => {
    const user = {
      id: '7d079df0-93bc-4ed7-8b4e-600060e4345f',
      role: 'Test Taker',
      email: 'user@example.com',
      isEmailVerified: false,
      createdByTestAdministrator: false,
      failedLoginAttempts: 0,
      save: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      ...overrides
    };
    user.update.mockImplementation(async (updates) => {
      Object.assign(user, updates);
      return user;
    });
    return user;
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-access-secret-with-at-least-32-characters';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRE = '15m';
    authService = require('../src/services/auth.service');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSessionCreate.mockResolvedValue({});
    mockAuthSessionDestroy.mockResolvedValue(0);
  });

  test('forgot-password creates a six-digit OTP record', async () => {
    const user = makeMutableUser({
      passwordResetSentAt: null,
    });
    mockFindOne.mockResolvedValue(user);

    const result = await authService.forgotPassword('user@example.com');

    expect(result.shouldSend).toBe(true);
    expect(result.resetOtp).toMatch(/^\d{6}$/);
    expect(user.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);
    expect(user.passwordResetExpires).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test('OTP reset verifies email and issues a fresh token family', async () => {
    const user = makeMutableUser({
      passwordResetSentAt: null,
    });
    mockFindOne.mockResolvedValue(user);
    const request = await authService.forgotPassword(user.email);

    const result = await authService.resetPasswordWithOtp({
      email: user.email,
      code: request.resetOtp,
      newPassword: 'new123'
    });

    expect(result.token).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(user.password).toBe('new123');
    expect(user.isEmailVerified).toBe(true);
    expect(mockAuthSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      userId: user.id,
      refreshTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/)
    }));
    expect(user.passwordResetToken).toBeNull();
  });

  test('email OTP is valid for five minutes and is single-use', async () => {
    const user = makeMutableUser({
      emailVerificationToken: hashToken('123456'),
      emailVerificationExpires: new Date(Date.now() + 5 * 60 * 1000)
    });
    mockFindOne.mockResolvedValue(user);

    await expect(authService.verifyEmail({ email: user.email, otp: '123456' }))
      .resolves.toMatchObject({ user });
    expect(user.isEmailVerified).toBe(true);
    expect(user.emailVerificationToken).toBeNull();

    await expect(authService.verifyEmail({ email: user.email, otp: '123456' }))
      .rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  test('expired email OTP is rejected', async () => {
    const user = makeMutableUser({
      emailVerificationToken: hashToken('123456'),
      emailVerificationExpires: new Date(Date.now() - 1)
    });
    mockFindOne.mockResolvedValue(user);

    await expect(authService.verifyEmail({ email: user.email, otp: '123456' }))
      .rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  test('resending invalidates the previous email OTP', async () => {
    const user = makeMutableUser({
      emailVerificationToken: hashToken('123456'),
      emailVerificationExpires: new Date(Date.now() + 5 * 60 * 1000),
      emailVerificationLastSentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      emailVerificationResendCount: 0,
      emailVerificationResendWindowStartedAt: new Date()
    });
    mockFindOne.mockResolvedValue(user);

    const resent = await authService.resendVerificationEmail(user.email);
    expect(resent.shouldSend).toBe(true);
    expect(resent.emailOtp).toMatch(/^\d{6}$/);
    expect(user.emailVerificationToken).toBe(hashToken(resent.emailOtp));
    expect(user.emailVerificationToken).not.toBe(hashToken('123456'));

    await expect(authService.verifyEmail({ email: user.email, otp: '123456' }))
      .rejects.toMatchObject({ code: 'INVALID_OTP' });
    await expect(authService.verifyEmail({ email: user.email, otp: resent.emailOtp }))
      .resolves.toMatchObject({ user });
  });

  test.each([
    'Test Taker',
    'Test Administrator',
    'System Administrator'
  ])('password-reset OTP succeeds for the %s role', async (role) => {
    const user = makeMutableUser({ role, passwordResetSentAt: null });
    mockFindOne.mockResolvedValue(user);

    const request = await authService.forgotPassword(user.email);
    await expect(authService.resetPasswordWithOtp({
      email: user.email,
      code: request.resetOtp,
      newPassword: 'new123'
    })).resolves.toMatchObject({
      user,
      token: expect.any(String),
      refreshToken: expect.any(String)
    });
  });

  test('password-reset rejects invalid, expired, reused, and unknown OTPs uniformly', async () => {
    const active = makeMutableUser({
      passwordResetToken: hashToken('123456'),
      passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000)
    });
    mockFindOne.mockResolvedValue(active);
    await expect(authService.resetPasswordWithOtp({
      email: active.email,
      code: '654321',
      newPassword: 'new123'
    })).rejects.toMatchObject({ code: 'INVALID_RESET_OTP' });

    const expired = makeMutableUser({
      passwordResetToken: hashToken('123456'),
      passwordResetExpires: new Date(Date.now() - 1)
    });
    mockFindOne.mockResolvedValue(expired);
    await expect(authService.resetPasswordWithOtp({
      email: expired.email,
      code: '123456',
      newPassword: 'new123'
    })).rejects.toMatchObject({ code: 'INVALID_RESET_OTP' });

    const reusable = makeMutableUser({
      passwordResetToken: hashToken('123456'),
      passwordResetExpires: new Date(Date.now() + 5 * 60 * 1000)
    });
    mockFindOne.mockResolvedValue(reusable);
    await authService.resetPasswordWithOtp({
      email: reusable.email,
      code: '123456',
      newPassword: 'new123'
    });
    await expect(authService.resetPasswordWithOtp({
      email: reusable.email,
      code: '123456',
      newPassword: 'new456'
    })).rejects.toMatchObject({ code: 'INVALID_RESET_OTP' });

    mockFindOne.mockResolvedValue(null);
    await expect(authService.resetPasswordWithOtp({
      email: 'unknown@example.com',
      code: '123456',
      newPassword: 'new123'
    })).rejects.toMatchObject({ code: 'INVALID_RESET_OTP' });
    await expect(authService.forgotPassword('unknown@example.com'))
      .resolves.toMatchObject({ shouldSend: false, user: null });
  });

  test('an interrupted registration resumes the same unverified record', async () => {
    const partial = makeMutableUser({
      id: 'partial-user',
      email: 'partial@example.com',
      isEmailVerified: false
    });
    mockFindOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(partial);

    const result = await authService.register({
      firstName: 'Partial',
      lastName: 'Learner',
      nationalId: '0001015000000',
      email: partial.email,
      password: 'new123',
      consent: true
    });

    expect(result.resumed).toBe(true);
    expect(result.user).toBe(partial);
    expect(partial.update).toHaveBeenCalledWith(expect.objectContaining({
      email: partial.email,
      emailVerificationToken: expect.stringMatching(/^[a-f0-9]{64}$/),
      emailVerificationAttempts: 0
    }));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('login sends an interrupted registration back to verification safely', async () => {
    const partial = makeMutableUser({
      isEmailVerified: false,
      comparePassword: jest.fn().mockResolvedValue(true)
    });
    mockFindOne.mockResolvedValue(partial);

    await expect(authService.login(partial.email, 'new123'))
      .rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', requiresVerification: true });
  });

  test('conflicting partial identities are not merged', async () => {
    const byNationalId = makeMutableUser({ id: 'partial-one', email: 'one@example.com' });
    const byEmail = makeMutableUser({ id: 'partial-two', email: 'two@example.com' });
    mockFindOne
      .mockResolvedValueOnce(byNationalId)
      .mockResolvedValueOnce(byEmail);

    await expect(authService.register({
      firstName: 'Partial',
      lastName: 'Learner',
      nationalId: '0001015000000',
      email: byEmail.email,
      password: 'new123',
      consent: true
    })).rejects.toMatchObject({ code: 'AMBIGUOUS_REGISTRATION' });
  });
});

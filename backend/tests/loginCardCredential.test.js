const {
  createLoginCardCredentialNonce,
  deriveLoginCardPassword
} = require('../src/utils/loginCardCredential');

describe('login-card credentials', () => {
  const originalSecret = process.env.LOGIN_CARD_PASSWORD_SECRET;

  beforeAll(() => {
    process.env.LOGIN_CARD_PASSWORD_SECRET = 'test-login-card-secret-with-at-least-32-characters';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.LOGIN_CARD_PASSWORD_SECRET;
    } else {
      process.env.LOGIN_CARD_PASSWORD_SECRET = originalSecret;
    }
  });

  test('derives the same printable password for the same user and nonce', () => {
    const first = deriveLoginCardPassword('student-1', 'nonce-1');
    const second = deriveLoginCardPassword('student-1', 'nonce-1');

    expect(first).toBe(second);
    expect(first).toHaveLength(12);
    expect(first).toMatch(/[A-Z]/);
    expect(first).toMatch(/[a-z]/);
    expect(first).toMatch(/[2-9]/);
    expect(first).not.toMatch(/[01ILOilo]/);
  });

  test('changes the password when the credential nonce changes', () => {
    expect(deriveLoginCardPassword('student-1', 'nonce-1'))
      .not.toBe(deriveLoginCardPassword('student-1', 'nonce-2'));
  });

  test('creates unpredictable nonce values', () => {
    const first = createLoginCardCredentialNonce();
    const second = createLoginCardCredentialNonce();

    expect(first).toMatch(/^[a-f0-9]{32}$/);
    expect(second).toMatch(/^[a-f0-9]{32}$/);
    expect(first).not.toBe(second);
  });
});

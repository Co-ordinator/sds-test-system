const crypto = require('crypto');

const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${DIGITS}`;
const PASSWORD_LENGTH = 12;

const getCredentialSecret = () => {
  const secret = process.env.LOGIN_CARD_PASSWORD_SECRET
    || process.env.DATA_ENCRYPTION_KEY
    || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('A login-card password secret is required');
  }

  return secret;
};

const pickCharacter = (alphabet, byte) => alphabet[byte % alphabet.length];

const createLoginCardCredentialNonce = () => crypto.randomBytes(16).toString('hex');

const deriveLoginCardPassword = (userId, nonce) => {
  if (!userId || !nonce) {
    throw new Error('User ID and credential nonce are required');
  }

  const digest = crypto
    .createHmac('sha256', getCredentialSecret())
    .update(`${userId}:${nonce}`)
    .digest();

  const characters = [
    pickCharacter(UPPERCASE, digest[0]),
    pickCharacter(LOWERCASE, digest[1]),
    pickCharacter(DIGITS, digest[2]),
  ];

  for (let index = characters.length; index < PASSWORD_LENGTH; index += 1) {
    characters.push(pickCharacter(ALL_CHARACTERS, digest[index]));
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = digest[PASSWORD_LENGTH + index] % (index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join('');
};

module.exports = {
  createLoginCardCredentialNonce,
  deriveLoginCardPassword,
};

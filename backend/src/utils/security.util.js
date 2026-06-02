const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Constant-time equality for two hex digests of equal length.
 * Falls back to false on any size mismatch (which already implies inequality).
 */
const safeCompareHex = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length || a.length === 0) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch (_) {
    return false;
  }
};

/**
 * Masks an email for safe logging: keeps the first and last char of the local
 * part plus the full domain, e.g. `j***e@example.com`. Returns null/falsy
 * inputs unchanged so callers can opt out trivially.
 */
const maskEmailForLog = (email) => {
  if (!email || typeof email !== 'string') return email;
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) {
    return `${trimmed[0] || ''}***`;
  }
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  if (local.length <= 2) {
    return `${local[0] || ''}***${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}${domain}`;
};

const getEncryptionKey = () => {
  const raw = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(raw).digest();
};

const hashValue = (value) => {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
};

const encryptValue = (value) => {
  if (!value) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptValue = (value) => {
  if (!value) return null;
  try {
    const parts = String(value).split(':');
    if (parts.length !== 3) return value;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (_) {
    return null;
  }
};

module.exports = {
  hashValue,
  encryptValue,
  decryptValue,
  safeCompareHex,
  maskEmailForLog
};

/**
 * Helper constants for role value mapping
 * Use these in your backend code instead of hardcoded strings
 */

const ROLES = {
  SYSTEM_ADMIN: 'System Administrator',
  TEST_ADMIN: 'Test Administrator',
  TEST_TAKER: 'Test Taker'
};

const USER_TYPES = {
  HIGH_SCHOOL: 'High School Student',
  UNIVERSITY: 'University Student',
  PROFESSIONAL: 'Professional',
  TEST_ADMIN: 'Test Administrator',
  SYSTEM_ADMIN: 'System Administrator'
};

// Legacy mapping for backward compatibility
const LEGACY_ROLE_MAP = {
  'admin': ROLES.SYSTEM_ADMIN,
  'test_administrator': ROLES.TEST_ADMIN,
  'test_taker': ROLES.TEST_TAKER
};

const LEGACY_USER_TYPE_MAP = {
  'test_taker_school': USER_TYPES.HIGH_SCHOOL,
  'test_taker_university': USER_TYPES.UNIVERSITY,
  'test_taker_professional': USER_TYPES.PROFESSIONAL,
  'test_administrator': USER_TYPES.TEST_ADMIN,
  'admin': USER_TYPES.SYSTEM_ADMIN
};

module.exports = {
  ROLES,
  USER_TYPES,
  LEGACY_ROLE_MAP,
  LEGACY_USER_TYPE_MAP
};

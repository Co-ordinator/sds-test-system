'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, EducationLevel, Occupation, Institution, AuthSession } = require('../models');
const { Op } = require('sequelize');
const { generateStudentCode } = require('../utils/generateStudentCode');
const { hashValue, safeCompareHex } = require('../utils/security.util');
const { BadRequestError, ConflictError, AuthError, NotFoundError } = require('../utils/errors/appError');
const { permanentlyDeleteUser } = require('./userDeletion.service');
const {
  getGradeEducationLevel,
  getEducationPairError
} = require('../utils/profileEducation');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toSeconds = (ms) => Math.ceil(ms / 1000);

// Registration verification and password reset use the same default OTP
// validity window. Either flow can still be overridden explicitly in env.
const EMAIL_OTP_RESEND_COOLDOWN_MS = parsePositiveInt(process.env.EMAIL_OTP_RESEND_COOLDOWN_MS, 2 * 60 * 1000);
const OTP_TTL_MS = parsePositiveInt(process.env.EMAIL_OTP_TTL_MS, 5 * 60 * 1000);
const OTP_TTL_MINUTES = Math.ceil(OTP_TTL_MS / 60000);
const PASSWORD_RESET_OTP_TTL_MS = parsePositiveInt(process.env.PASSWORD_RESET_OTP_TTL_MS, OTP_TTL_MS);
const PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS = parsePositiveInt(process.env.PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS, EMAIL_OTP_RESEND_COOLDOWN_MS);

/** All required onboarding fields captured for Test Takers (no placeholder names — use onboarding_completed flag). */
const hasOnboardingText = (value) => String(value ?? '').trim() !== '';
const hasOnboardingNumber = (value) => value !== null && value !== undefined && String(value).trim() !== '';

const TEST_TAKER_PROFILE_FIELDS = new Set([
  'firstName', 'lastName', 'gender', 'userType', 'region', 'district', 'address',
  'preferredLanguage', 'gradeLevel', 'educationLevel', 'currentInstitution',
  'institutionId', 'workplaceName', 'workplaceInstitutionId', 'currentOccupation',
  'currentOccupationId', 'yearsExperience', 'degreeProgram', 'yearOfStudy'
]);

function getMissingTestTakerProfileFields(u) {
  if (!u || u.role !== 'Test Taker') return [];
  const missing = [];
  if (!hasOnboardingText(u.firstName)) missing.push('firstName');
  if (!hasOnboardingText(u.lastName)) missing.push('lastName');
  if (!u.gender) missing.push('gender');
  if (!u.userType) missing.push('userType');
  if (!u.region) missing.push('region');
  if (!hasOnboardingText(u.district)) missing.push('district');
  if (!hasOnboardingText(u.address)) missing.push('address');
  if (!u.preferredLanguage) missing.push('preferredLanguage');
  if (!hasOnboardingText(u.gradeLevel)) missing.push('gradeLevel');
  if (!u.educationLevel) missing.push('educationLevel');

  if (u.userType === 'Professional') {
    if (!hasOnboardingText(u.workplaceName) && !u.workplaceInstitutionId) missing.push('workplaceName');
    if (!hasOnboardingText(u.currentOccupation) && !u.currentOccupationId) missing.push('currentOccupation');
    if (!hasOnboardingNumber(u.yearsExperience)) missing.push('yearsExperience');
  }
  if (u.userType === 'High School Student' || u.userType === 'University Student') {
    if (!hasOnboardingText(u.currentInstitution) && !u.institutionId) missing.push('currentInstitution');
    if (u.userType === 'University Student') {
      if (!hasOnboardingText(u.degreeProgram)) missing.push('degreeProgram');
      if (!hasOnboardingNumber(u.yearOfStudy)) missing.push('yearOfStudy');
    }
  }
  return missing;
}

function computeTestTakerOnboardingComplete(u) {
  return getMissingTestTakerProfileFields(u).length === 0;
}

async function maybeSetOnboardingCompleted(userId) {
  const u = await User.findByPk(userId);
  if (!u || u.role !== 'Test Taker') return;
  const isComplete = computeTestTakerOnboardingComplete(u);
  if (u.onboardingCompleted !== isComplete) {
    await u.update({ onboardingCompleted: isComplete });
  }
}

const parseNationalId = (nationalId) => {
  if (!nationalId || nationalId.length !== 13) return { dateOfBirth: null, gender: null };
  const yy = parseInt(nationalId.substring(0, 2));
  const mm = parseInt(nationalId.substring(2, 4)) - 1;
  const dd = parseInt(nationalId.substring(4, 6));
  const currentYearShort = new Date().getFullYear() % 100;
  const century = yy > currentYearShort ? 1900 : 2000;
  const fullYear = century + yy;
  const genderDigits = parseInt(nationalId.substring(6, 10));
  const gender = genderDigits < 5000 ? 'female' : 'male';
  return { dateOfBirth: new Date(fullYear, mm, dd).toISOString().split('T')[0], gender };
};

// ── Token helpers (exported for controller use) ─────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const signRefreshToken = (id, role, sessionId) =>
  jwt.sign(
    { id, role, sid: sessionId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d', jwtid: crypto.randomUUID() }
  );

const hashToken = (tokenValue) => {
  if (!tokenValue) return null;
  return crypto.createHash('sha256').update(tokenValue).digest('hex');
};

const OTP_LENGTH = 6;
const OTP_MAX_ATTEMPTS = 5;

// Resend throttling (per-account, server-enforced — the 30s client cooldown is UX only).
const RESEND_MIN_INTERVAL_MS = 30 * 1000;
const RESEND_DAILY_CAP = 5;
const RESEND_WINDOW_MS = 24 * 60 * 60 * 1000;

// Login throttling
const LOGIN_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

// Refresh-token rotation
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
// Grace window during which a just-rotated RT is still recognised — required so
// concurrent in-flight refreshes from the same browser don't accidentally trip
// the reuse-detection guard.
const REFRESH_TOKEN_REUSE_GRACE_MS = 60 * 1000;

const generateEmailOtp = () => {
  const max = 10 ** OTP_LENGTH;
  const value = crypto.randomInt(0, max);
  return String(value).padStart(OTP_LENGTH, '0');
};

const createPasswordResetRecord = () => {
  const otpCode = generateEmailOtp();
  const sentAt = new Date();
  return {
    otpCode,
    otpHash: hashToken(otpCode),
    expiresAt: new Date(sentAt.getTime() + PASSWORD_RESET_OTP_TTL_MS),
    sentAt
  };
};

const clearLegacyRefreshFields = (user) => {
  user.refreshToken = null;
  user.refreshTokenExpires = null;
  user.previousRefreshToken = null;
  user.previousRefreshTokenExpires = null;
};

const revokeAllAuthSessions = async (user) => {
  await AuthSession.destroy({ where: { userId: user.id } });
  clearLegacyRefreshFields(user);
};

const issueAuthTokens = async (user) => {
  const sessionId = crypto.randomUUID();
  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.role, sessionId);
  await AuthSession.create({
    id: sessionId,
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    previousRefreshTokenHash: null,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    previousExpiresAt: null,
    lastUsedAt: new Date(),
    revokedAt: null
  });
  return { token, refreshToken, sessionId };
};

const rotateSessionRefreshToken = async ({ decoded, presentedHash }) => {
  const user = await User.findByPk(decoded.id);
  if (!user) {
    throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }

  const now = Date.now();
  const newRefreshToken = signRefreshToken(user.id, user.role, decoded.sid);
  const [rotated] = await AuthSession.update({
    previousRefreshTokenHash: presentedHash,
    previousExpiresAt: new Date(now + REFRESH_TOKEN_REUSE_GRACE_MS),
    refreshTokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(now + REFRESH_TOKEN_TTL_MS),
    lastUsedAt: new Date(now)
  }, {
    where: {
      id: decoded.sid,
      userId: user.id,
      refreshTokenHash: presentedHash,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date(now) }
    }
  });

  if (rotated === 1) {
    return {
      newAccessToken: signToken(user.id, user.role),
      newRefreshToken,
      reuseDetected: false
    };
  }

  // A second tab can legitimately arrive just after the atomic rotation.
  const session = await AuthSession.findOne({
    where: { id: decoded.sid, userId: user.id }
  });
  const previousMatches = session?.previousRefreshTokenHash
    && safeCompareHex(session.previousRefreshTokenHash, presentedHash);
  const previousValid = previousMatches
    && !session.revokedAt
    && session.previousExpiresAt
    && new Date(session.previousExpiresAt).getTime() > now;

  if (previousValid) {
    return {
      newAccessToken: signToken(user.id, user.role),
      newRefreshToken: null,
      reuseDetected: false
    };
  }

  if (previousMatches && session && !session.revokedAt) {
    await session.update({
      revokedAt: new Date(now),
      refreshTokenHash: hashToken(`revoked:${session.id}:${now}`),
      previousRefreshTokenHash: null,
      previousExpiresAt: null
    });
    const error = new AuthError(
      'Refresh token was reused — this device session was revoked. Please sign in again.',
      'REFRESH_TOKEN_REUSED',
      401
    );
    error.reuseDetected = true;
    throw error;
  }

  throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
};

module.exports = {
  signToken,
  signRefreshToken,
  OTP_TTL_MINUTES,

  /* ─── Register ────────────────────────────────────────────────────────── */
  register: async ({ firstName, lastName, nationalId, email, password, consent }) => {
    if (!consent) throw new BadRequestError('You must accept the data processing terms to register.', 'NO_CONSENT');
    if (!firstName?.trim()) throw new BadRequestError('Given name is required', 'FIRST_NAME_REQUIRED');
    if (!lastName?.trim()) throw new BadRequestError('Surname is required', 'LAST_NAME_REQUIRED');
    if (!nationalId?.trim()) throw new BadRequestError('National ID is required', 'NATIONAL_ID_REQUIRED');
    if (!email?.trim()) throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    if (!password) throw new BadRequestError('Password is required', 'PASSWORD_REQUIRED');

    const cleanFirstName = String(firstName).trim();
    const cleanLastName = String(lastName).trim();
    const cleanNationalId = String(nationalId).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^\d{13}$/.test(cleanNationalId)) {
      throw new BadRequestError('National ID must be exactly 13 digits', 'INVALID_NATIONAL_ID');
    }

    const isResumableSignup = (candidate) =>
      candidate
      && !candidate.isEmailVerified
      && candidate.role === 'Test Taker'
      && !candidate.createdByTestAdministrator;

    const existingUser = await User.findOne({ where: { nationalIdHash: hashValue(cleanNationalId) } });
    if (existingUser && !isResumableSignup(existingUser)) {
      throw new ConflictError(
        'An account with this National ID already exists. If you didn\'t complete registration, request a new verification code or sign in.',
        'NATIONAL_ID_EXISTS'
      );
    }

    const existingEmailUser = await User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } }
    });
    if (existingEmailUser && !isResumableSignup(existingEmailUser)) {
      throw new ConflictError(
        'An account with this email already exists. If you didn\'t complete registration, request a new verification code or sign in.',
        'EMAIL_EXISTS'
      );
    }
    if (existingUser && existingEmailUser && existingUser.id !== existingEmailUser.id) {
      throw new ConflictError(
        'These details partially match existing incomplete registrations. Please contact support to resolve your account.',
        'AMBIGUOUS_REGISTRATION'
      );
    }

    const emailOtp = generateEmailOtp();
    const emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    const { dateOfBirth, gender } = parseNationalId(cleanNationalId);

    const resumableUser = existingUser || existingEmailUser;
    if (resumableUser) {
      await resumableUser.update({
        nationalId: cleanNationalId,
        email: cleanEmail,
        password,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        dateOfBirth,
        gender,
        isConsentGiven: true,
        consentDate: new Date(),
        emailVerificationToken: hashToken(emailOtp),
        emailVerificationExpires: emailOtpExpires,
        emailVerificationAttempts: 0,
        emailVerificationLastSentAt: new Date()
      });
      return {
        user: resumableUser,
        emailOtp,
        resendAvailableInSeconds: toSeconds(RESEND_MIN_INTERVAL_MS),
        resumed: true
      };
    }

    const studentCode = await generateStudentCode();

    let user;
    try {
      user = await User.create({
        nationalId: cleanNationalId,
        email: cleanEmail,
        password,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        onboardingCompleted: false,
        dateOfBirth,
        gender,
        role: 'Test Taker',
        studentCode,
        isConsentGiven: true,
        consentDate: new Date(),
        emailVerificationToken: hashToken(emailOtp),
        emailVerificationExpires: emailOtpExpires,
        emailVerificationAttempts: 0,
        emailVerificationLastSentAt: new Date(),
        emailVerificationResendCount: 0,
        emailVerificationResendWindowStartedAt: new Date()
      });
    } catch (error) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        const fields = (error?.errors || []).map((entry) => entry.path);
        if (fields.includes('email')) {
          throw new ConflictError(
            'An account with this email already exists. If you didn\'t complete registration, request a new verification code or sign in.',
            'EMAIL_EXISTS'
          );
        }
        if (fields.includes('national_id_hash') || fields.includes('nationalIdHash')) {
          throw new ConflictError(
            'An account with this National ID already exists. If you didn\'t complete registration, request a new verification code or sign in.',
            'NATIONAL_ID_EXISTS'
          );
        }
        throw new ConflictError('An account with these details already exists. Please login instead.', 'USER_EXISTS');
      }
      if (error?.name === 'SequelizeValidationError') {
        throw new BadRequestError('Invalid registration details. Check National ID, email, and password and try again.', 'INVALID_REGISTRATION_DETAILS');
      }
      throw error;
    }

    return { user, emailOtp };
  },

  /* ─── Verify Email (OTP) ──────────────────────────────────────────────── */
  verifyEmail: async ({ email, otp }) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    // Uniform failure response — never reveal *which* check failed:
    // - email format invalid
    // - email not registered
    // - account already verified (don't confirm account existence)
    // - OTP wrong, expired, or already consumed
    const invalidOtp = () => new BadRequestError(
      'Verification code is invalid or has expired',
      'INVALID_OTP'
    );

    if (!cleanEmail || !/^\d{6}$/.test(cleanOtp)) {
      throw invalidOtp();
    }

    const user = await User.findOne({ where: { email: { [Op.iLike]: cleanEmail } } });
    if (!user) throw invalidOtp();

    // SECURITY: even if the account is already verified, do NOT issue tokens
    // without an OTP match. Otherwise any actor that knows the email could
    // hijack the session by sending an arbitrary 6-digit guess.
    if (user.isEmailVerified) throw invalidOtp();

    const storedHash = user.emailVerificationToken;
    const expiresAt = user.emailVerificationExpires;
    if (!storedHash || !expiresAt || new Date(expiresAt).getTime() < Date.now()) {
      throw invalidOtp();
    }

    if (!safeCompareHex(storedHash, hashToken(cleanOtp))) {
      // Per-account brute-force cap: count this wrong attempt and, once we've
      // hit the limit, invalidate the OTP so the attacker must wait for a new
      // one to be issued via resend (which also clears the counter).
      const nextAttempts = (user.emailVerificationAttempts || 0) + 1;
      const updates = { emailVerificationAttempts: nextAttempts };
      if (nextAttempts >= OTP_MAX_ATTEMPTS) {
        updates.emailVerificationToken = null;
        updates.emailVerificationExpires = null;
      }
      await user.update(updates).catch(() => {});
      throw invalidOtp();
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationAttempts = 0;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    let token = null;
    let refreshToken = null;
    try {
      const issued = await issueAuthTokens(user);
      token = issued.token;
      refreshToken = issued.refreshToken;
    } catch (_) {}

    return { user, token, refreshToken };
  },

  verifyEmailOtp: async ({ email, code }) =>
    module.exports.verifyEmail({ email, otp: code }),

  /* ─── Login ───────────────────────────────────────────────────────────── */
  login: async (identifier, password) => {
    if (!identifier || !password) {
      throw new BadRequestError('Please provide your email or username and password', 'LOGIN_FIELDS_REQUIRED');
    }

    const cleanIdentifier = String(identifier).trim();

    // Case-insensitive email match — registration always lowercases, but legacy
    // rows or admin-created accounts may be mixed case.
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { studentCode: cleanIdentifier },
          { email: { [Op.iLike]: cleanIdentifier } },
          { username: cleanIdentifier },
          { studentNumber: cleanIdentifier }
        ]
      }
    });

    const invalidCreds = () => new AuthError('Incorrect email/username or password', 'INVALID_CREDENTIALS', 401);

    if (!user) throw invalidCreds();

    // Per-account lockout (NIST SP 800-63B §5.2.2 / OWASP ASVS V2.2.1). We
    // surface the lockout to the legitimate user (UX) at the cost of confirming
    // account existence — acceptable given the attacker has already racked up
    // 5+ failures by this point.
    const now = new Date();
    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > now.getTime()) {
      const retryAfterSec = Math.ceil((new Date(user.lockoutUntil).getTime() - now.getTime()) / 1000);
      const error = new AuthError(
        'This account is temporarily locked because of too many failed sign-in attempts. Try again later or reset your password.',
        'ACCOUNT_LOCKED',
        423
      );
      error.retryAfterSec = retryAfterSec;
      throw error;
    }

    if (!(await user.comparePassword(password))) {
      // Increment failure counter. We trip the lockout once we cross the
      // threshold and re-arm the counter so the next attempt after lockout
      // expiry doesn't immediately re-lock the account.
      const nextFailed = (user.failedLoginAttempts || 0) + 1;
      const updates = { failedLoginAttempts: nextFailed };
      if (nextFailed >= LOGIN_MAX_FAILED_ATTEMPTS) {
        updates.lockoutUntil = new Date(Date.now() + LOGIN_LOCKOUT_MS);
        updates.failedLoginAttempts = 0;
      }
      await user.update(updates).catch(() => {});
      throw invalidCreds();
    }

    const requiresVerification = user.email && !user.isEmailVerified && !user.createdByTestAdministrator;
    if (requiresVerification) {
      const error = new AuthError('Your email address is not verified. Please enter the verification code we sent to your inbox.', 'EMAIL_NOT_VERIFIED', 403);
      error.requiresVerification = true;
      throw error;
    }

    user.lastLogin = new Date();
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    const { token, refreshToken } = await issueAuthTokens(user);

    const { Permission } = require('../models');
    const userWithPerms = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'refreshToken', 'refreshTokenExpires', 'previousRefreshToken', 'previousRefreshTokenExpires'] },
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }]
    });

    return { user: userWithPerms || user, token, refreshToken, mustChangePassword: user.mustChangePassword || false };
  },

  /* ─── Get Me ──────────────────────────────────────────────────────────── */
  getMe: async (userId) => {
    const { Permission } = require('../models');
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] },
      include: [
        { model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } },
        { model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region', 'district'], required: false },
        { model: Institution, as: 'workplace', attributes: ['id', 'name', 'type', 'region', 'district'], required: false },
        { model: EducationLevel, as: 'education', attributes: ['id', 'level', 'description'], required: false },
        { model: Occupation, as: 'occupation', attributes: ['id', 'name', 'category'], required: false }
      ]
    });
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    return user;
  },

  /* ─── Update Profile ──────────────────────────────────────────────────── */
  updateProfile: async (userId, body) => {
    const { sequelize } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    if (user.email && !user.isEmailVerified && !user.createdByTestAdministrator) {
      const error = new AuthError('Please verify your email before completing onboarding.', 'EMAIL_NOT_VERIFIED', 403);
      error.requiresVerification = true;
      throw error;
    }

    // SECURITY: nationalId and email are deliberately NOT in this list. They
    // are the identity anchors for the account and must only be changed via
    // an administrator-mediated flow (audited identity change).
    const commonAllowed = [
      'phoneNumber', 'region', 'district', 'address',
      'preferredLanguage', 'requiresAccessibility', 'accessibilityNeeds'
    ];
    const testTakerAllowed = [
      'firstName', 'lastName', 'gender',
      'currentInstitution', 'gradeLevel', 'employmentStatus', 'currentOccupation',
      'workplaceInstitutionId', 'workplaceName', 'degreeProgram', 'yearOfStudy',
      'yearsExperience', 'userType', 'institutionId', 'currentOccupationId', 'educationLevel'
    ];
    const allowed = user.role === 'Test Taker'
      ? [...commonAllowed, ...testTakerAllowed]
      : commonAllowed;
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key] === '' || body[key] === null ? null : body[key];
      }
    }

    const effectiveGradeLevel = updates.gradeLevel !== undefined ? updates.gradeLevel : user.gradeLevel;
    const effectiveUserType = updates.userType !== undefined ? updates.userType : user.userType;
    const gradeLevelNum = getGradeEducationLevel(effectiveGradeLevel);
    if (updates.gradeLevel && !gradeLevelNum) {
      throw new BadRequestError(
        'Select a supported current or highest grade.',
        'INVALID_GRADE_LEVEL'
      );
    }
    if (gradeLevelNum) {
      if (effectiveUserType === 'University Student' && gradeLevelNum < 2) {
        throw new BadRequestError(
          'Education level cannot be lower than high school while studying at university.',
          'EDUCATION_LEVEL_CONFLICT'
        );
      }
      if (effectiveUserType === 'High School Student' && gradeLevelNum > 2) {
        throw new BadRequestError(
          'Education level cannot be a tertiary qualification while still in high school.',
          'EDUCATION_LEVEL_CONFLICT'
        );
      }
    }

    let selectedEducationLevel = null;
    if (updates.educationLevel) {
      selectedEducationLevel = await EducationLevel.findByPk(updates.educationLevel);
      if (!selectedEducationLevel) {
        throw new BadRequestError('Select a valid education level.', 'INVALID_EDUCATION_LEVEL');
      }
    } else if (updates.educationLevel === undefined && user.educationLevel) {
      selectedEducationLevel = await EducationLevel.findByPk(user.educationLevel);
    }

    // Onboarding captures a grade selection and derives the stable education
    // level UUID. Profile editing sends both values and must keep them aligned.
    if (updates.gradeLevel && updates.educationLevel === undefined) {
      selectedEducationLevel = await EducationLevel.findOne({ where: { level: gradeLevelNum } });
      if (!selectedEducationLevel) {
        throw new BadRequestError('The selected education level is not configured.', 'EDUCATION_LEVEL_NOT_CONFIGURED');
      }
      updates.educationLevel = selectedEducationLevel.id;
    }

    const pairError = getEducationPairError({
      gradeLevel: effectiveGradeLevel,
      educationLevel: selectedEducationLevel
    });
    if (pairError) {
      throw new BadRequestError(pairError, 'EDUCATION_LEVEL_CONFLICT');
    }

    const touchesTestTakerProfile = user.role === 'Test Taker'
      && Object.keys(updates).some((key) => TEST_TAKER_PROFILE_FIELDS.has(key));
    if (touchesTestTakerProfile) {
      const effectiveProfile = {
        ...(typeof user.get === 'function' ? user.get({ plain: true }) : user),
        ...updates,
        role: user.role
      };
      const missingFields = getMissingTestTakerProfileFields(effectiveProfile);
      if (missingFields.length > 0) {
        const error = new BadRequestError(
          `Complete the required profile field "${missingFields[0]}" before saving.`,
          'PROFILE_REQUIRED_FIELD_MISSING'
        );
        error.fields = missingFields;
        throw error;
      }
    }

    // Occupation resolution
    if (updates.currentOccupationId) {
      const occ = await Occupation.findByPk(updates.currentOccupationId);
      if (occ) updates.currentOccupation = occ.name;
      else throw new BadRequestError('Select a valid occupation.', 'INVALID_OCCUPATION');
    } else if (updates.currentOccupation && !updates.currentOccupationId) {
      const occText = updates.currentOccupation.trim();
      if (occText) {
        let occ = await Occupation.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), occText.toLowerCase()) });
        if (!occ) occ = await Occupation.findOne({ where: { name: { [Op.iLike]: `%${occText}%` } }, order: [['name', 'ASC']] });
        if (occ) {
          updates.currentOccupationId = occ.id;
          updates.currentOccupation = occ.name;
        } else {
          const newOcc = await Occupation.create({ name: occText, status: 'pending_review', submittedBy: userId });
          updates.currentOccupationId = newOcc.id;
        }
      }
    }

    // Institution resolution (school/university)
    if (updates.institutionId) {
      const inst = await Institution.findByPk(updates.institutionId);
      if (inst) updates.currentInstitution = inst.name;
      else throw new BadRequestError('Select a valid institution.', 'INVALID_INSTITUTION');
    } else if (updates.currentInstitution && !updates.institutionId) {
      const instText = updates.currentInstitution.trim();
      if (instText) {
        let inst = await Institution.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), instText.toLowerCase()) });
        if (!inst) inst = await Institution.findOne({ where: { name: { [Op.iLike]: `%${instText}%` } }, order: [['name', 'ASC']] });
        if (inst) {
          updates.institutionId = inst.id;
          updates.currentInstitution = inst.name;
        } else {
          const inferredType = effectiveUserType === 'High School Student' ? 'school' : 'other';
          const newInst = await Institution.create({ name: instText, type: inferredType, status: 'pending_review', submittedBy: userId });
          updates.institutionId = newInst.id;
        }
      }
    }

    // Workplace institution resolution
    if (updates.workplaceInstitutionId) {
      const wpInst = await Institution.findByPk(updates.workplaceInstitutionId);
      if (wpInst) updates.workplaceName = wpInst.name;
      else throw new BadRequestError('Select a valid workplace.', 'INVALID_WORKPLACE');
    } else if (updates.workplaceName && !updates.workplaceInstitutionId) {
      const wpText = updates.workplaceName.trim();
      if (wpText) {
        let wpInst = await Institution.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), wpText.toLowerCase()) });
        if (!wpInst) wpInst = await Institution.findOne({ where: { name: { [Op.iLike]: `%${wpText}%` } }, order: [['name', 'ASC']] });
        if (wpInst) {
          updates.workplaceInstitutionId = wpInst.id;
          updates.workplaceName = wpInst.name;
        } else {
          const newWpInst = await Institution.create({ name: wpText, type: 'other', status: 'pending_review', submittedBy: userId });
          updates.workplaceInstitutionId = newWpInst.id;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestError('No valid fields to update', 'NO_VALID_UPDATES');
    }

    if (touchesTestTakerProfile) {
      const effectiveProfile = {
        ...(typeof user.get === 'function' ? user.get({ plain: true }) : user),
        ...updates,
        role: user.role
      };
      const missingFields = getMissingTestTakerProfileFields(effectiveProfile);
      if (missingFields.length > 0) {
        const error = new BadRequestError(
          `Complete the required profile field "${missingFields[0]}" before saving.`,
          'PROFILE_REQUIRED_FIELD_MISSING'
        );
        error.fields = missingFields;
        throw error;
      }
    }

    await user.update(updates);
    await maybeSetOnboardingCompleted(user.id);

    const { Permission } = require('../models');
    const updated = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'refreshToken'] },
      include: [
        { model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } },
        { model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region', 'district'], required: false },
        { model: Institution, as: 'workplace', attributes: ['id', 'name', 'type', 'region', 'district'], required: false },
        { model: EducationLevel, as: 'education', attributes: ['id', 'level', 'description'], required: false },
        { model: Occupation, as: 'occupation', attributes: ['id', 'name', 'category'], required: false }
      ]
    });
    return { updated, updates };
  },

  /* ─── Forgot Password ─────────────────────────────────────────────────── */
  /**
   * Non-enumerable: returns `{ shouldSend, user, resetToken }`. The caller
   * MUST always respond to the client with the same generic message — never
   * confirm whether the identifier actually maps to a real account.
   */
  forgotPassword: async (identifier) => {
    if (!identifier) {
      throw new BadRequestError('Login number, email, username, or student number is required', 'IDENTIFIER_REQUIRED');
    }

    const cleanIdentifier = String(identifier).trim();

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { studentCode: cleanIdentifier },
          { email: { [Op.iLike]: cleanIdentifier } },
          { username: cleanIdentifier },
          { studentNumber: cleanIdentifier }
        ]
      }
    });

    if (!user || !user.email) {
      return { shouldSend: false, user: null, resetToken: null };
    }

    const now = Date.now();
    if (user.passwordResetSentAt) {
      const resendAvailableAtMs = new Date(user.passwordResetSentAt).getTime() + PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS;
      const remainingMs = resendAvailableAtMs - now;
      if (remainingMs > 0) {
        const cooldownError = new AuthError(
          `Please wait ${toSeconds(remainingMs)} seconds before requesting another reset code.`,
          'PASSWORD_RESET_OTP_RESEND_COOLDOWN',
          429
        );
        cooldownError.resendAvailableInSeconds = toSeconds(remainingMs);
        throw cooldownError;
      }
    }

    const resetRecord = createPasswordResetRecord();
    user.passwordResetToken = resetRecord.otpHash;
    user.passwordResetExpires = resetRecord.expiresAt;
    user.passwordResetSentAt = resetRecord.sentAt;
    await user.save();

    return {
      shouldSend: true,
      user,
      resetOtp: resetRecord.otpCode,
      resendAvailableInSeconds: toSeconds(PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS),
      otpExpiresInSeconds: toSeconds(PASSWORD_RESET_OTP_TTL_MS)
    };
  },

  resetPasswordWithOtp: async ({ email, code, newPassword }) => {
    const invalidResetCode = () => new BadRequestError(
      'Reset code is invalid or has expired. Request a new code and try again.',
      'INVALID_RESET_OTP'
    );
    if (!email?.trim()) {
      throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    }
    if (!code?.trim()) {
      throw new BadRequestError('Reset code is required', 'OTP_REQUIRED');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      throw new BadRequestError('Reset code must be 6 digits', 'INVALID_OTP_FORMAT');
    }

    const user = await User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } }
    });

    if (!user) throw invalidResetCode();
    if (!user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
      throw invalidResetCode();
    }

    if (!safeCompareHex(hashToken(cleanCode), user.passwordResetToken)) {
      throw invalidResetCode();
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetSentAt = null;

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      user.emailVerificationAttempts = 0;
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.mustChangePassword = false;
    await revokeAllAuthSessions(user);
    await user.save();

    const { token, refreshToken } = await issueAuthTokens(user);
    return { user, token, refreshToken };
  },

  /* ─── Reset Password ──────────────────────────────────────────────────── */
  /**
   * Atomic reset:
   *  - constant-time hash comparison
   *  - issues a brand-new refresh-token family
   *  - nukes any existing session (OWASP ASVS V3.5.4 / NIST 800-63B §7.1)
   *  - marks the email verified, since clicking the reset link proves email
   *    control (Auth0 / AWS Cognito convention)
   */
  resetPassword: async (tokenParam, newPassword) => {
    const decoded = (() => {
      try { return jwt.verify(tokenParam, process.env.JWT_SECRET); }
      catch (_) { throw new BadRequestError('Token is invalid or has expired', 'INVALID_TOKEN'); }
    })();

    const candidate = await User.findOne({ where: { id: decoded.id } });
    if (!candidate || !candidate.passwordResetToken || !candidate.passwordResetExpires) {
      throw new BadRequestError('Token is invalid or has expired', 'INVALID_TOKEN');
    }
    if (new Date(candidate.passwordResetExpires).getTime() < Date.now()) {
      throw new BadRequestError('Token is invalid or has expired', 'INVALID_TOKEN');
    }
    if (!safeCompareHex(candidate.passwordResetToken, hashToken(tokenParam))) {
      throw new BadRequestError('Token is invalid or has expired', 'INVALID_TOKEN');
    }
    const user = candidate;

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    // C-3: invalidate every other browser/device session.
    await revokeAllAuthSessions(user);

    // C-4: clicking the reset link proves email ownership.
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      user.emailVerificationAttempts = 0;
    }

    // Clear any lockout, force-change flag, and abandoned-OTP throttle state.
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    user.mustChangePassword = false;

    await user.save();

    const { token, refreshToken } = await issueAuthTokens(user);
    return { user, token, refreshToken };
  },

  /* ─── Refresh Token (rotation + reuse detection) ──────────────────────── */
  /**
   * Issues a new (access, refresh) pair and rotates only the current
   * browser/device session. Legacy cookies are migrated on first refresh.
   *
   * Returns `{ newAccessToken, newRefreshToken }` on success.
   */
  refreshAccessToken: async (refreshTokenValue) => {
    if (!refreshTokenValue) throw new AuthError('No refresh token provided', 'REFRESH_TOKEN_MISSING', 401);

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    } catch (_) {
      throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }

    const presentedHash = hashToken(refreshTokenValue);
    if (decoded.sid) {
      return rotateSessionRefreshToken({ decoded, presentedHash });
    }

    // Compatibility path for cookies issued before auth_sessions existed.
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }

    const now = Date.now();
    const currentValid = user.refreshToken
      && user.refreshTokenExpires
      && new Date(user.refreshTokenExpires).getTime() > now
      && safeCompareHex(user.refreshToken, presentedHash);

    if (currentValid) {
      const issued = await issueAuthTokens(user);
      clearLegacyRefreshFields(user);
      await user.save();

      return {
        newAccessToken: issued.token,
        newRefreshToken: issued.refreshToken,
        reuseDetected: false
      };
    }

    // If we get here and the *previous* RT slot matches, it could be either a
    // race (acceptable inside the grace window) or a replay (outside it). We
    // only treat outside-grace replays as compromise.
    if (user.previousRefreshToken && safeCompareHex(user.previousRefreshToken, presentedHash)) {
      const previousValid = user.previousRefreshTokenExpires
        && new Date(user.previousRefreshTokenExpires).getTime() > now;
      if (previousValid) {
        // Grace-window race — issue a new access token without further
        // rotation, but don't hand out a fresh RT (the latest one is already
        // out there in the legitimate client).
        const newAccessToken = signToken(user.id, user.role);
        return { newAccessToken, newRefreshToken: null, reuseDetected: false };
      }

      // Outside grace window → token reuse → revoke the entire family.
      clearLegacyRefreshFields(user);
      await user.save();

      const error = new AuthError('Refresh token was reused — session revoked. Please sign in again.', 'REFRESH_TOKEN_REUSED', 401);
      error.reuseDetected = true;
      throw error;
    }

    throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
  },

  /* ─── Logout ──────────────────────────────────────────────────────────── */
  logout: async (refreshTokenValue) => {
    if (refreshTokenValue) {
      const hashed = hashToken(refreshTokenValue);
      const removedSessions = await AuthSession.destroy({
        where: {
          [Op.or]: [
            { refreshTokenHash: hashed },
            { previousRefreshTokenHash: hashed }
          ]
        }
      });
      if (removedSessions > 0) return;
      // Match either slot — current OR the just-rotated one. We don't trip
      // reuse-detection on logout; the user is explicitly revoking.
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { refreshToken: hashed },
            { previousRefreshToken: hashed }
          ]
        }
      });
      if (user) {
        clearLegacyRefreshFields(user);
        await user.save();
      }
    }
  },

  /* ─── Export User Data ────────────────────────────────────────────────── */
  exportUserData: async (userId) => {
    const user = await User.findByPk(userId, {
      include: [{ association: 'assessments', include: [{ association: 'answers' }] }, { association: 'auditLogs' }]
    });
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    return user;
  },

  /* ─── Delete Account Permanently ──────────────────────────────────────── */
  /**
   * Permanently removes the account and its user-owned assessment data so all
   * credentials and unique identifiers can be reused for a fresh registration.
  */
  deleteUserAccount: async (userId) => {
    const { snapshot, fileCleanupFailures } = await permanentlyDeleteUser(userId);
    return { user: null, snapshot, fileCleanupFailures };
  },

  /* ─── Resend Verification ─────────────────────────────────────────────── */
  /**
   * Non-enumerable: returns the same shape regardless of whether the email is
   * registered or already verified. `shouldSend` tells the caller whether a
   * fresh OTP was actually generated (and therefore needs to be emailed).
   * Throttled per-account with two layers:
   *   - minimum 30 s between OTP issuances (`RESEND_MIN_INTERVAL_MS`)
   *   - hard cap of N issuances inside a rolling 24 h window (`RESEND_DAILY_CAP`)
   * Throttle responses still look like a successful send to the client.
   */
  resendVerificationEmail: async (email) => {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    }

    const user = await User.findOne({ where: { email: { [Op.iLike]: cleanEmail } } });
    if (!user || user.isEmailVerified) {
      return { shouldSend: false, user: null, emailOtp: null, previousVerification: null, throttled: false };
    }

    const now = Date.now();

    // Min-interval throttle (per-account flood control).
    if (user.emailVerificationLastSentAt) {
      const since = now - new Date(user.emailVerificationLastSentAt).getTime();
      if (since < RESEND_MIN_INTERVAL_MS) {
        return { shouldSend: false, user, emailOtp: null, previousVerification: null, throttled: true };
      }
    }

    // Rolling 24h cap.
    let windowStart = user.emailVerificationResendWindowStartedAt
      ? new Date(user.emailVerificationResendWindowStartedAt).getTime()
      : 0;
    let windowCount = user.emailVerificationResendCount || 0;
    if (!windowStart || now - windowStart > RESEND_WINDOW_MS) {
      windowStart = now;
      windowCount = 0;
    }
    if (windowCount >= RESEND_DAILY_CAP) {
      return { shouldSend: false, user, emailOtp: null, previousVerification: null, throttled: true };
    }

    const previousVerification = {
      token: user.emailVerificationToken,
      expires: user.emailVerificationExpires,
      attempts: user.emailVerificationAttempts || 0,
      lastSentAt: user.emailVerificationLastSentAt,
      resendCount: user.emailVerificationResendCount || 0,
      resendWindowStartedAt: user.emailVerificationResendWindowStartedAt
    };
    const emailOtp = generateEmailOtp();
    user.emailVerificationToken = hashToken(emailOtp);
    user.emailVerificationExpires = new Date(now + OTP_TTL_MS);
    user.emailVerificationAttempts = 0;
    user.emailVerificationLastSentAt = new Date(now);
    user.emailVerificationResendCount = windowCount + 1;
    user.emailVerificationResendWindowStartedAt = new Date(windowStart);
    await user.save();

    return { shouldSend: true, user, emailOtp, previousVerification, throttled: false };
  },

  /* ─── Change Password ─────────────────────────────────────────────────── */
  /**
   * Verifies the current password, sets a new one, and invalidates all other
   * sessions (OWASP ASVS V3.5.4). The caller must re-issue cookies for the
   * just-authenticated request and clear them on every other device the next
   * time those clients call /refresh-token.
   */
  changePassword: async (userId, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw new BadRequestError('Current password and new password are required', 'PASSWORD_FIELDS_REQUIRED');
    }
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw new AuthError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD', 401);

    user.password = newPassword;
    user.mustChangePassword = false;

    // Invalidate every active session (NIST 800-63B §7.1).
    await revokeAllAuthSessions(user);
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Re-issue tokens for the just-authenticated session so the user's
    // current device keeps working.
    const { token: accessToken, refreshToken } = await issueAuthTokens(user);

    return { user, accessToken, refreshToken };
  },

  /** Recompute onboarding completion after profile updates (Test Takers only). */
  maybeSetOnboardingCompleted
};

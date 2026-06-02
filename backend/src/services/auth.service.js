'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, EducationLevel, Occupation, Institution } = require('../models');
const { Op } = require('sequelize');
const { generateStudentCode } = require('../utils/generateStudentCode');
const { hashValue, safeCompareHex } = require('../utils/security.util');
const { BadRequestError, ConflictError, AuthError, NotFoundError } = require('../utils/errors/appError');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const EMAIL_OTP_LENGTH = 6;
const EMAIL_OTP_TTL_MS = parsePositiveInt(process.env.EMAIL_OTP_TTL_MS, 10 * 60 * 1000);
const EMAIL_OTP_RESEND_COOLDOWN_MS = parsePositiveInt(process.env.EMAIL_OTP_RESEND_COOLDOWN_MS, 2 * 60 * 1000);
const PASSWORD_RESET_OTP_TTL_MS = parsePositiveInt(process.env.PASSWORD_RESET_OTP_TTL_MS, EMAIL_OTP_TTL_MS);
const PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS = parsePositiveInt(process.env.PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS, EMAIL_OTP_RESEND_COOLDOWN_MS);

// Grade level text → education_levels.level mapping
const GRADE_TO_EDUCATION_LEVEL = {
  'Form 3 (Junior Secondary)': 1,
  'Form 5 / O-Level (Senior Secondary)': 2,
  'A-Level': 2,
  'Certificate / Diploma': 3,
  'Bachelor\'s degree': 4,
  'Postgraduate': 5,
};

/** All required onboarding fields captured for Test Takers (no placeholder names — use onboarding_completed flag). */
const hasOnboardingText = (value) => String(value ?? '').trim() !== '';
const hasOnboardingNumber = (value) => value !== null && value !== undefined && String(value).trim() !== '';

function computeTestTakerOnboardingComplete(u) {
  if (!u || u.role !== 'Test Taker') return true;
  if (!hasOnboardingText(u.firstName) || !hasOnboardingText(u.lastName)) return false;
  if (!u.gender) return false;
  if (!u.userType) return false;
  if (!u.region) return false;
  if (!hasOnboardingText(u.district)) return false;
  if (!hasOnboardingText(u.address)) return false;
  if (!u.preferredLanguage) return false;
  if (!hasOnboardingText(u.gradeLevel)) return false;

  if (u.userType === 'Professional') {
    const hasWorkplace = hasOnboardingText(u.workplaceName) || !!u.workplaceInstitutionId;
    const hasOccupation = hasOnboardingText(u.currentOccupation) || !!u.currentOccupationId;
    return hasWorkplace && hasOccupation && hasOnboardingNumber(u.yearsExperience);
  }
  if (u.userType === 'High School Student' || u.userType === 'University Student') {
    const hasInstitution = hasOnboardingText(u.currentInstitution) || !!u.institutionId;
    if (u.userType === 'High School Student') return hasInstitution;
    return hasInstitution && hasOnboardingText(u.degreeProgram) && hasOnboardingNumber(u.yearOfStudy);
  }
  return true;
}

async function maybeSetOnboardingCompleted(userId) {
  const u = await User.findByPk(userId);
  if (!u || u.role !== 'Test Taker' || u.onboardingCompleted) return;
  if (!computeTestTakerOnboardingComplete(u)) return;
  await u.update({ onboardingCompleted: true });
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

const signRefreshToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const hashToken = (tokenValue) => {
  if (!tokenValue) return null;
  return crypto.createHash('sha256').update(tokenValue).digest('hex');
};

const OTP_LENGTH = 6;
const OTP_TTL_MS = 15 * 60 * 1000;
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

const PII_FIELDS_TO_SCRUB = [
  'firstName', 'lastName', 'email', 'username', 'nationalId',
  'phoneNumber', 'address', 'studentCode', 'studentNumber',
  'workplaceName', 'currentInstitution', 'currentOccupation', 'organization',
  'testAdministratorCode', 'dateOfBirth'
];

module.exports = {
  signToken,
  signRefreshToken,

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

    const existingUser = await User.findOne({ where: { nationalIdHash: hashValue(cleanNationalId) } });
    if (existingUser) {
      throw new ConflictError(
        'An account with this National ID already exists. If you didn\'t complete registration, request a new verification code or sign in.',
        'NATIONAL_ID_EXISTS'
      );
    }

    const existingEmailUser = await User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } }
    });
    if (existingEmailUser) {
      throw new ConflictError(
        'An account with this email already exists. If you didn\'t complete registration, request a new verification code or sign in.',
        'EMAIL_EXISTS'
      );
    }

    const emailOtp = generateEmailOtp();
    const emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    const studentCode = await generateStudentCode();
    const { dateOfBirth, gender } = parseNationalId(cleanNationalId);

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
      token = signToken(user.id, user.role);
      refreshToken = signRefreshToken(user.id, user.role);
      user.refreshToken = hashToken(refreshToken);
      user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
      user.previousRefreshToken = null;
      user.previousRefreshTokenExpires = null;
      await user.save();
    } catch (_) {}

    return { user, token, refreshToken };
  },

  verifyEmailOtp: async ({ email, code }) => {
    if (!email?.trim()) {
      throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    }
    if (!code?.trim()) {
      throw new BadRequestError('Verification code is required', 'OTP_REQUIRED');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      throw new BadRequestError('Verification code must be 6 digits', 'INVALID_OTP_FORMAT');
    }

    const user = await User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } }
    });

    if (!user) {
      throw new NotFoundError('No user found with that email', 'USER_NOT_FOUND');
    }

    if (user.isEmailVerified) {
      const { token, refreshToken } = await issueAuthTokens(user);
      return { user, token, refreshToken, alreadyVerified: true };
    }

    if (!user.emailVerificationToken || !user.emailVerificationExpires || user.emailVerificationExpires <= new Date()) {
      throw new BadRequestError('Verification code has expired. Request a new code and try again.', 'OTP_EXPIRED');
    }

    if (hashToken(cleanCode) !== user.emailVerificationToken) {
      throw new BadRequestError('Incorrect verification code. Please check and try again.', 'INVALID_OTP');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationSentAt = null;
    await user.save();

    const { token, refreshToken } = await issueAuthTokens(user);
    return { user, token, refreshToken, alreadyVerified: false };
  },

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

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    user.previousRefreshToken = null;
    user.previousRefreshTokenExpires = null;
    await user.save();

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
        { model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region', 'district'], required: false }
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
    const allowed = [
      'firstName', 'lastName', 'gender', 'phoneNumber', 'region', 'district', 'address',
      'currentInstitution', 'gradeLevel', 'employmentStatus', 'currentOccupation',
      'preferredLanguage', 'requiresAccessibility', 'accessibilityNeeds',
      'workplaceInstitutionId', 'workplaceName', 'degreeProgram', 'yearOfStudy',
      'yearsExperience', 'userType', 'institutionId', 'currentOccupationId'
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key] === '' || body[key] === null ? null : body[key];
      }
    }

    // Grade Level → Education Level UUID
    if (updates.gradeLevel) {
      const levelNum = GRADE_TO_EDUCATION_LEVEL[updates.gradeLevel];
      if (levelNum) {
        const edLevel = await EducationLevel.findOne({ where: { level: levelNum } });
        if (edLevel) updates.educationLevel = edLevel.id;
      }
    }

    // Occupation resolution
    if (updates.currentOccupationId) {
      const occ = await Occupation.findByPk(updates.currentOccupationId);
      if (occ) updates.currentOccupation = occ.name;
      else updates.currentOccupationId = null;
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
      else updates.institutionId = null;
    } else if (updates.currentInstitution && !updates.institutionId) {
      const instText = updates.currentInstitution.trim();
      if (instText) {
        let inst = await Institution.findOne({ where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), instText.toLowerCase()) });
        if (!inst) inst = await Institution.findOne({ where: { name: { [Op.iLike]: `%${instText}%` } }, order: [['name', 'ASC']] });
        if (inst) {
          updates.institutionId = inst.id;
          updates.currentInstitution = inst.name;
        } else {
          const newInst = await Institution.create({ name: instText, type: 'other', status: 'pending_review', submittedBy: userId });
          updates.institutionId = newInst.id;
        }
      }
    }

    // Workplace institution resolution
    if (updates.workplaceInstitutionId) {
      const wpInst = await Institution.findByPk(updates.workplaceInstitutionId);
      if (wpInst) updates.workplaceName = wpInst.name;
      else updates.workplaceInstitutionId = null;
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

    await user.update(updates);
    await maybeSetOnboardingCompleted(user.id);

    const updated = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'refreshToken'] }
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
      user,
      resetOtp: resetRecord.otpCode,
      resendAvailableInSeconds: toSeconds(PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS),
      otpExpiresInSeconds: toSeconds(PASSWORD_RESET_OTP_TTL_MS)
    };
  },

  resetPasswordWithOtp: async ({ email, code, newPassword }) => {
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

    if (!user) throw new NotFoundError('No user found with that email', 'USER_NOT_FOUND');
    if (!user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
      throw new BadRequestError('Reset code has expired. Request a new code and try again.', 'OTP_EXPIRED');
    }

    if (hashToken(cleanCode) !== user.passwordResetToken) {
      throw new BadRequestError('Incorrect reset code. Please check and try again.', 'INVALID_OTP');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetSentAt = null;
    await user.save();

    return { shouldSend: true, user, resetToken };
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

    // C-3: invalidate every other session by rotating the family.
    user.refreshToken = null;
    user.refreshTokenExpires = null;
    user.previousRefreshToken = null;
    user.previousRefreshTokenExpires = null;

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

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await user.save();
    return { user, token, refreshToken };
  },

  /* ─── Refresh Token (rotation + reuse detection) ──────────────────────── */
  /**
   * Issues a new (access, refresh) pair and rotates the refresh-token family.
   * The previously-current RT is parked in `previousRefreshToken` for a short
   * grace window so concurrent in-flight refreshes from the same browser don't
   * trip reuse detection. Any RT that matches the *previous* slot but not the
   * current one is treated as a replay attack and burns the entire session.
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
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
    }

    const now = Date.now();
    const currentValid = user.refreshToken
      && user.refreshTokenExpires
      && new Date(user.refreshTokenExpires).getTime() > now
      && safeCompareHex(user.refreshToken, presentedHash);

    if (currentValid) {
      const newRefreshToken = signRefreshToken(user.id, user.role);
      // Park the *just-rotated* hash in `previousRefreshToken` so concurrent
      // in-flight refreshes don't get bounced as replays.
      user.previousRefreshToken = user.refreshToken;
      user.previousRefreshTokenExpires = new Date(now + REFRESH_TOKEN_REUSE_GRACE_MS);
      user.refreshToken = hashToken(newRefreshToken);
      user.refreshTokenExpires = new Date(now + REFRESH_TOKEN_TTL_MS);
      await user.save();

      const newAccessToken = signToken(user.id, user.role);
      return { newAccessToken, newRefreshToken, reuseDetected: false };
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
      user.refreshToken = null;
      user.refreshTokenExpires = null;
      user.previousRefreshToken = null;
      user.previousRefreshTokenExpires = null;
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
        user.refreshToken = null;
        user.refreshTokenExpires = null;
        user.previousRefreshToken = null;
        user.previousRefreshTokenExpires = null;
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

  /* ─── Delete Account (soft, with PII scrub) ───────────────────────────── */
  /**
   * Soft-deletes the user and scrubs PII fields so the row no longer
   * reveals identity. Foreign-key references (assessments, audit logs) are
   * preserved for regulatory reporting, but every relatable identifier is
   * either nulled (releasing UNIQUE slots so the email/National-ID can be
   * reused by a new account) or replaced with a benign placeholder.
   *
   * `User.paranoid = true` causes `destroy()` to set `deleted_at`, which is
   * automatically filtered out by subsequent queries.
   */
  deleteUserAccount: async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    // Capture before scrub so the caller can audit-log the original email.
    const snapshot = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    for (const field of PII_FIELDS_TO_SCRUB) {
      // The `nationalId` setter cascades to `nationalIdHash`, so setting null
      // here also clears the hash and frees the UNIQUE slot.
      user.set(field, null);
    }
    user.isActive = false;
    user.refreshToken = null;
    user.refreshTokenExpires = null;
    user.previousRefreshToken = null;
    user.previousRefreshTokenExpires = null;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.lockoutUntil = null;
    user.failedLoginAttempts = 0;
    user.piiScrubbedAt = new Date();

    await user.save();
    await user.destroy(); // paranoid: sets deletedAt

    return { user, snapshot };
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
    user.refreshToken = null;
    user.refreshTokenExpires = null;
    user.previousRefreshToken = null;
    user.previousRefreshTokenExpires = null;
    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

    // Re-issue tokens for the just-authenticated session so the user's
    // current device keeps working.
    const accessToken = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await user.save();

    return { user, accessToken, refreshToken };
  },

  /** Recompute onboarding completion after profile updates (Test Takers only). */
  maybeSetOnboardingCompleted
};

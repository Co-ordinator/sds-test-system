'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, EducationLevel, Occupation, Institution } = require('../models');
const { Op } = require('sequelize');
const { generateStudentCode } = require('../utils/generateStudentCode');
const { hashValue } = require('../utils/security.util');
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
function computeTestTakerOnboardingComplete(u) {
  if (!u || u.role !== 'Test Taker') return true;
  const fn = (u.firstName || '').trim();
  const ln = (u.lastName || '').trim();
  if (!fn || !ln) return false;
  if (!u.userType) return false;
  if (!u.region) return false;
  if (!((u.district || '').trim())) return false;
  if (u.userType === 'Professional') {
    return !!(((u.workplaceName || '').trim()) || u.workplaceInstitutionId);
  }
  if (u.userType === 'High School Student' || u.userType === 'University Student') {
    return !!(((u.currentInstitution || '').trim()) || u.institutionId);
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

const createEmailOtp = () =>
  crypto.randomInt(0, 10 ** EMAIL_OTP_LENGTH).toString().padStart(EMAIL_OTP_LENGTH, '0');

const createEmailVerificationRecord = () => {
  const sentAt = new Date();
  const otp = createEmailOtp();
  return {
    otpCode: otp,
    otpHash: hashToken(otp),
    sentAt,
    expiresAt: new Date(sentAt.getTime() + EMAIL_OTP_TTL_MS)
  };
};

const createPasswordResetRecord = () => {
  const sentAt = new Date();
  const otp = createEmailOtp();
  return {
    otpCode: otp,
    otpHash: hashToken(otp),
    sentAt,
    expiresAt: new Date(sentAt.getTime() + PASSWORD_RESET_OTP_TTL_MS)
  };
};

const toSeconds = (milliseconds) => Math.max(0, Math.ceil(milliseconds / 1000));

const issueAuthTokens = async (user) => {
  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id, user.role);
  user.refreshToken = hashToken(refreshToken);
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await user.save();
  return { token, refreshToken };
};

module.exports = {
  signToken,
  signRefreshToken,

  /* ─── Register ────────────────────────────────────────────────────────── */
  register: async ({ nationalId, email, password, consent }) => {
    if (!consent) throw new BadRequestError('You must accept the data processing terms to register.', 'NO_CONSENT');
    if (!nationalId?.trim()) throw new BadRequestError('National ID is required', 'NATIONAL_ID_REQUIRED');
    if (!email?.trim()) throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    if (!password) throw new BadRequestError('Password is required', 'PASSWORD_REQUIRED');

    const cleanNationalId = String(nationalId).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^\d{13}$/.test(cleanNationalId)) {
      throw new BadRequestError('National ID must be exactly 13 digits', 'INVALID_NATIONAL_ID');
    }

    const existingUser = await User.findOne({ where: { nationalIdHash: hashValue(cleanNationalId) } });
    if (existingUser) {
      throw new ConflictError('An account with this National ID already exists. Please login instead.', 'NATIONAL_ID_EXISTS');
    }

    const existingEmailUser = await User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } }
    });
    if (existingEmailUser) {
      throw new ConflictError('An account with this email already exists. Please login instead.', 'EMAIL_EXISTS');
    }

    const verificationRecord = createEmailVerificationRecord();
    const studentCode = await generateStudentCode();
    const { dateOfBirth, gender } = parseNationalId(cleanNationalId);

    let user;
    try {
      user = await User.create({
        nationalId: cleanNationalId,
        email: cleanEmail,
        password,
        firstName: null,
        lastName: null,
        onboardingCompleted: false,
        dateOfBirth,
        gender,
        role: 'Test Taker',
        studentCode,
        isConsentGiven: true,
        consentDate: new Date(),
        emailVerificationToken: verificationRecord.otpHash,
        emailVerificationExpires: verificationRecord.expiresAt,
        emailVerificationSentAt: verificationRecord.sentAt
      });
    } catch (error) {
      if (error?.name === 'SequelizeUniqueConstraintError') {
        const fields = (error?.errors || []).map((entry) => entry.path);
        if (fields.includes('email')) {
          throw new ConflictError('An account with this email already exists. Please login instead.', 'EMAIL_EXISTS');
        }
        if (fields.includes('national_id_hash') || fields.includes('nationalIdHash')) {
          throw new ConflictError('An account with this National ID already exists. Please login instead.', 'NATIONAL_ID_EXISTS');
        }
        throw new ConflictError('An account with these details already exists. Please login instead.', 'USER_EXISTS');
      }
      if (error?.name === 'SequelizeValidationError') {
        throw new BadRequestError('Invalid registration details. Check National ID, email, and password and try again.', 'INVALID_REGISTRATION_DETAILS');
      }
      throw error;
    }

    return {
      user,
      emailOtp: verificationRecord.otpCode,
      resendAvailableInSeconds: toSeconds(EMAIL_OTP_RESEND_COOLDOWN_MS)
    };
  },

  /* ─── Verify Email ────────────────────────────────────────────────────── */
  verifyEmail: async (tokenParam) => {
    let user = await User.findOne({
      where: { emailVerificationToken: hashToken(tokenParam), emailVerificationExpires: { [Op.gt]: new Date() } }
    });

    if (!user) {
      // Check if this token belongs to an already verified user by checking recent tokens
      // We need to find the user by checking if they have isEmailVerified=true and recently had this token
      const recentlyVerifiedUser = await User.findOne({
        where: { 
          isEmailVerified: true,
          // Check if user was verified in the last hour (to handle race conditions)
          updatedAt: { [Op.gt]: new Date(Date.now() - 60 * 60 * 1000) }
        },
        order: [['updatedAt', 'DESC']]
      });
      
      if (recentlyVerifiedUser) {
        let token = null;
        let refreshToken = null;
        try {
          token = signToken(recentlyVerifiedUser.id, recentlyVerifiedUser.role);
          refreshToken = signRefreshToken(recentlyVerifiedUser.id, recentlyVerifiedUser.role);
          recentlyVerifiedUser.refreshToken = hashToken(refreshToken);
          recentlyVerifiedUser.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await recentlyVerifiedUser.save();
        } catch (_) {}
        return { user: recentlyVerifiedUser, token, refreshToken, alreadyVerified: true };
      }
      throw new BadRequestError('Token is invalid or has expired', 'INVALID_TOKEN');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationSentAt = null;
    await user.save();

    let token = null;
    let refreshToken = null;
    try {
      ({ token, refreshToken } = await issueAuthTokens(user));
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

    const user = await User.findOne({
      where: { [Op.or]: [{ studentCode: identifier }, { email: identifier }, { username: identifier }, { studentNumber: identifier }] }
    });

    if (!user || !(await user.comparePassword(password))) {
      throw new AuthError('Incorrect email/username or password', 'INVALID_CREDENTIALS', 401);
    }

    const requiresVerification = user.email && !user.isEmailVerified && !user.createdByTestAdministrator;
    if (requiresVerification) {
      const error = new AuthError('Your email address is not verified. Enter the verification code sent to your email.', 'EMAIL_NOT_VERIFIED', 403);
      error.requiresVerification = true;
      throw error;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    const { Permission } = require('../models');
    const userWithPerms = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken', 'refreshToken', 'refreshTokenExpires'] },
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }]
    });

    return { user: userWithPerms || user, token, refreshToken, mustChangePassword: user.mustChangePassword || false };
  },

  /* ─── Get Me ──────────────────────────────────────────────────────────── */
  getMe: async (userId) => {
    const { Permission } = require('../models');
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'emailVerificationToken'] },
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }]
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

    const allowed = [
      'firstName', 'lastName', 'gender', 'nationalId', 'phoneNumber', 'region', 'district', 'address',
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
  forgotPassword: async (identifier) => {
    if (!identifier) throw new BadRequestError('Login number, email, username, or student number is required', 'IDENTIFIER_REQUIRED');

    const user = await User.findOne({
      where: { [Op.or]: [{ studentCode: identifier }, { email: identifier }, { username: identifier }, { studentNumber: identifier }] }
    });
    if (!user) throw new NotFoundError('No user found with that login number, email, username, or student number', 'USER_NOT_FOUND');
    if (!user.email) throw new BadRequestError('Cannot send reset code: no email on file', 'EMAIL_MISSING');

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

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();
    return { user, token, refreshToken };
  },

  /* ─── Reset Password ──────────────────────────────────────────────────── */
  resetPassword: async (tokenParam, newPassword) => {
    const decoded = jwt.verify(tokenParam, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: { id: decoded.id, passwordResetToken: hashToken(tokenParam), passwordResetExpires: { [Op.gt]: new Date() } }
    });
    if (!user) throw new BadRequestError('Token is invalid or has expired', 'INVALID_TOKEN');

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();
    return { user, token, refreshToken };
  },

  /* ─── Refresh Token ───────────────────────────────────────────────────── */
  refreshAccessToken: async (refreshTokenValue) => {
    if (!refreshTokenValue) throw new AuthError('No refresh token provided', 'REFRESH_TOKEN_MISSING', 401);
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({
      where: { id: decoded.id, refreshToken: hashToken(refreshTokenValue), refreshTokenExpires: { [Op.gt]: new Date() } }
    });
    if (!user) throw new AuthError('Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN', 401);
    const newAccessToken = signToken(user.id, user.role);
    return { newAccessToken };
  },

  /* ─── Logout ──────────────────────────────────────────────────────────── */
  logout: async (refreshTokenValue) => {
    if (refreshTokenValue) {
      const user = await User.findOne({ where: { refreshToken: hashToken(refreshTokenValue) } });
      if (user) {
        user.refreshToken = null;
        user.refreshTokenExpires = null;
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

  /* ─── Delete Account ──────────────────────────────────────────────────── */
  deleteUserAccount: async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    await user.destroy();
    return user;
  },

  /* ─── Resend Verification ─────────────────────────────────────────────── */
  resendVerificationEmail: async (email) => {
    if (!email?.trim()) {
      throw new BadRequestError('Email is required', 'EMAIL_REQUIRED');
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({
      where: { email: { [Op.iLike]: cleanEmail } }
    });
    if (!user) throw new NotFoundError('No user found with that email', 'USER_NOT_FOUND');
    if (user.isEmailVerified) throw new BadRequestError('Email is already verified', 'EMAIL_ALREADY_VERIFIED');

    const now = Date.now();
    if (user.emailVerificationSentAt) {
      const resendAvailableAtMs = new Date(user.emailVerificationSentAt).getTime() + EMAIL_OTP_RESEND_COOLDOWN_MS;
      const remainingMs = resendAvailableAtMs - now;
      if (remainingMs > 0) {
        const cooldownError = new AuthError(
          `Please wait ${toSeconds(remainingMs)} seconds before requesting another code.`,
          'OTP_RESEND_COOLDOWN',
          429
        );
        cooldownError.resendAvailableInSeconds = toSeconds(remainingMs);
        throw cooldownError;
      }
    }

    const previousVerification = {
      token: user.emailVerificationToken,
      expires: user.emailVerificationExpires,
      sentAt: user.emailVerificationSentAt
    };

    const verificationRecord = createEmailVerificationRecord();
    user.emailVerificationToken = verificationRecord.otpHash;
    user.emailVerificationExpires = verificationRecord.expiresAt;
    user.emailVerificationSentAt = verificationRecord.sentAt;
    await user.save();

    return {
      user,
      emailOtp: verificationRecord.otpCode,
      previousVerification,
      resendAvailableInSeconds: toSeconds(EMAIL_OTP_RESEND_COOLDOWN_MS)
    };
  },

  /* ─── Change Password ─────────────────────────────────────────────────── */
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
    await user.save();
    return user;
  },

  /** Recompute onboarding completion after profile updates (Test Takers only). */
  maybeSetOnboardingCompleted
};

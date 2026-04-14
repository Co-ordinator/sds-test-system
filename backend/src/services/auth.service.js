'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, EducationLevel, Occupation, Institution } = require('../models');
const { Op } = require('sequelize');
const { generateStudentCode } = require('../utils/generateStudentCode');
const { hashValue } = require('../utils/security.util');

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

module.exports = {
  signToken,
  signRefreshToken,

  /* ─── Register ────────────────────────────────────────────────────────── */
  register: async ({ nationalId, email, password, consent }) => {
    if (!consent) throw Object.assign(new Error('You must accept the data processing terms to register.'), { code: 'NO_CONSENT', status: 400 });
    if (!nationalId?.trim()) throw Object.assign(new Error('National ID is required'), { status: 400 });
    if (!email?.trim()) throw Object.assign(new Error('Email is required'), { status: 400 });
    if (!password) throw Object.assign(new Error('Password is required'), { status: 400 });

    const cleanNationalId = String(nationalId).trim();
    if (!/^\d{13}$/.test(cleanNationalId)) {
      throw Object.assign(new Error('National ID must be exactly 13 digits'), { status: 400 });
    }

    const existingUser = await User.findOne({ where: { nationalIdHash: hashValue(cleanNationalId) } });
    if (existingUser) {
      throw Object.assign(new Error('An account with this National ID already exists. Please login instead.'), { status: 409 });
    }

    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const studentCode = await generateStudentCode();
    const { dateOfBirth, gender } = parseNationalId(cleanNationalId);

    const user = await User.create({
      nationalId: cleanNationalId,
      email: email.trim(),
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
      emailVerificationToken: hashToken(emailToken),
      emailVerificationExpires: emailTokenExpires
    });

    const token = signToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id, user.role);
    user.refreshToken = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    return { user, token, refreshToken, emailToken };
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
        return { user: recentlyVerifiedUser, token: null, refreshToken: null, alreadyVerified: true };
      }
      throw Object.assign(new Error('Token is invalid or has expired'), { status: 400 });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    let token = null;
    let refreshToken = null;
    try {
      token = signToken(user.id, user.role);
      refreshToken = signRefreshToken(user.id, user.role);
      user.refreshToken = hashToken(refreshToken);
      user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await user.save();
    } catch (_) {}

    return { user, token, refreshToken };
  },

  /* ─── Login ───────────────────────────────────────────────────────────── */
  login: async (identifier, password) => {
    if (!identifier || !password) {
      throw Object.assign(new Error('Please provide your email or username and password'), { status: 400 });
    }

    const user = await User.findOne({
      where: { [Op.or]: [{ studentCode: identifier }, { email: identifier }, { username: identifier }, { studentNumber: identifier }] }
    });

    if (!user || !(await user.comparePassword(password))) {
      throw Object.assign(new Error('Incorrect email/username or password'), { status: 401 });
    }

    const requiresVerification = user.email && !user.isEmailVerified && !user.createdByTestAdministrator;
    if (requiresVerification) {
      throw Object.assign(new Error('Your email address is not verified. Please check your inbox for the verification link.'), { status: 403, requiresVerification: true });
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
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  },

  /* ─── Update Profile ──────────────────────────────────────────────────── */
  updateProfile: async (userId, body) => {
    const { sequelize } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

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
      throw Object.assign(new Error('No valid fields to update'), { status: 400 });
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
    if (!identifier) throw Object.assign(new Error('Login number, email, username, or student number is required'), { status: 400 });

    const user = await User.findOne({
      where: { [Op.or]: [{ studentCode: identifier }, { email: identifier }, { username: identifier }, { studentNumber: identifier }] }
    });
    if (!user) throw Object.assign(new Error('No user found with that login number, email, username, or student number'), { status: 404 });
    if (!user.email) throw Object.assign(new Error('Cannot send reset link: no email on file'), { status: 400 });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await user.save();

    return { user, resetToken };
  },

  /* ─── Reset Password ──────────────────────────────────────────────────── */
  resetPassword: async (tokenParam, newPassword) => {
    const decoded = jwt.verify(tokenParam, process.env.JWT_SECRET);
    const user = await User.findOne({
      where: { id: decoded.id, passwordResetToken: hashToken(tokenParam), passwordResetExpires: { [Op.gt]: new Date() } }
    });
    if (!user) throw Object.assign(new Error('Token is invalid or has expired'), { status: 400 });

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
    if (!refreshTokenValue) throw Object.assign(new Error('No refresh token provided'), { status: 401 });
    const decoded = jwt.verify(refreshTokenValue, process.env.JWT_REFRESH_SECRET);
    const user = await User.findOne({
      where: { id: decoded.id, refreshToken: hashToken(refreshTokenValue), refreshTokenExpires: { [Op.gt]: new Date() } }
    });
    if (!user) throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401 });
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
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    return user;
  },

  /* ─── Delete Account ──────────────────────────────────────────────────── */
  deleteUserAccount: async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
    await user.destroy();
    return user;
  },

  /* ─── Resend Verification ─────────────────────────────────────────────── */
  resendVerificationEmail: async (email) => {
    const user = await User.findOne({ where: { email } });
    if (!user) throw Object.assign(new Error('No user found with that email'), { status: 404 });
    if (user.isEmailVerified) throw Object.assign(new Error('Email is already verified'), { status: 400 });

    const emailToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = hashToken(emailToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    return { user, emailToken };
  },

  /* ─── Change Password ─────────────────────────────────────────────────── */
  changePassword: async (userId, currentPassword, newPassword) => {
    if (!currentPassword || !newPassword) {
      throw Object.assign(new Error('Current password and new password are required'), { status: 400 });
    }
    const user = await User.findByPk(userId);
    if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) throw Object.assign(new Error('Current password is incorrect'), { status: 401 });

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    return user;
  },

  /** Recompute onboarding completion after profile updates (Test Takers only). */
  maybeSetOnboardingCompleted
};

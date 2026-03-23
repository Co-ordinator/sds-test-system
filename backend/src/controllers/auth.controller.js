const authService = require('../services/auth.service');
const { AuditLog } = require('../models');
const { logAuthAction } = require('../middleware/authentication.middleware');
const { sendEmail } = require('../config/email.config');
const logger = require('../utils/logger');

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth'
  });
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/api/v1/auth', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
};

const register = async (req, res, next) => {
  try {
    const { user, token, refreshToken, emailToken } = await authService.register(req.body);
    logger.info({ actionType: 'REGISTER', message: `User registered: ${user.email}`, req, details: { email: user.email, role: user.role } });
    await logAuthAction(req, 'REGISTER', user.id);
    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({ status: 'success', token, data: { user: user.toJSON() } });

    if (user.email) {
      sendEmail({
        email: user.email,
        subject: 'Welcome to SDS Test System - Verify Your Email',
        template: 'welcome-verify',
        context: { firstName: user.firstName, lastName: user.lastName, email: user.email, region: user.region, verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailToken}` }
      })
        .then(() => AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Welcome email sent', details: { resourceType: 'email', resourceId: user.id, requestMethod: 'POST', requestPath: '/api/v1/auth/register' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }))
        .catch(emailError => {
          logger.error({ actionType: 'EMAIL_FAILED', message: 'Welcome email failed', req, details: { error: emailError.message } });
          AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Failed to send welcome email', details: { resourceType: 'email', resourceId: user.id, errorMessage: emailError.message, requestMethod: 'POST', requestPath: '/api/v1/auth/register' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
        });
    }
  } catch (error) {
    logger.error({ actionType: 'REGISTER_FAILED', message: 'User registration failed', req, details: { error: error.message, stack: error.stack } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { user, token, refreshToken, alreadyVerified } = await authService.verifyEmail(req.params.token);
    if (!alreadyVerified) {
      logger.info({ actionType: 'VERIFY_EMAIL', message: `Email verified for user: ${user.email}`, req, details: { userId: user.id } });
      await AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Email verified', details: { resourceType: 'user', resourceId: user.id, requestMethod: 'GET', requestPath: `/api/v1/auth/verify-email/${req.params.token}` }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
    }
    if (refreshToken) setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', message: alreadyVerified ? 'Your email is already verified. Please log in.' : (token ? 'Email successfully verified!' : 'Email successfully verified. Please log in.'), ...(token ? { token } : {}), data: { user: user.toJSON() } });
  } catch (error) {
    logger.error({ actionType: 'VERIFY_EMAIL_FAILED', message: 'Email verification failed', req, details: { error: error.message, stack: error.stack } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier ?? req.body.email ?? req.body.username ?? '').toString().trim();
    const { user, token, refreshToken, mustChangePassword } = await authService.login(identifier, req.body.password);
    logger.info({ actionType: 'LOGIN', message: `User logged in: ${user.email}`, req, details: { userId: user.id } });
    await logAuthAction(req, 'LOGIN', user.id);
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', token, mustChangePassword, data: { user: user.toJSON ? user.toJSON() : user } });
  } catch (error) {
    logger.warn({ actionType: 'LOGIN_FAILED', message: error.message, req });
    if (error.status === 401) return res.status(401).json({ status: 'error', message: error.message });
    if (error.status === 403) return res.status(403).json({ status: 'error', message: error.message, requiresVerification: error.requiresVerification });
    if (error.status === 400) return res.status(400).json({ status: 'error', message: error.message });
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    logger.info({ actionType: 'GET_ME', message: `User profile retrieved: ${user.email || user.id}`, req, details: { userId: user.id } });
    res.status(200).json({ status: 'success', data: { user: user.toJSON ? user.toJSON() : user } });
  } catch (error) {
    logger.error({ actionType: 'GET_ME_FAILED', message: 'Failed to retrieve user profile', req, details: { error: error.message } });
    if (error.status === 404) return res.status(404).json({ status: 'error', message: error.message });
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { updated, updates } = await authService.updateProfile(req.user.id, req.body);
    logger.info({ actionType: 'PROFILE_UPDATE', message: `Profile updated: ${req.user.id}`, req, details: { userId: req.user.id, resolvedFields: Object.keys(updates) } });
    res.status(200).json({ status: 'success', data: { user: updated } });
  } catch (error) {
    logger.error({ actionType: 'PROFILE_UPDATE_FAILED', message: 'Failed to update profile', req, details: { error: error.message } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || '').trim();
    const { user, resetToken } = await authService.forgotPassword(identifier);
    logger.info({ actionType: 'FORGOT_PASSWORD', message: `Password reset token sent to: ${user.email}`, req, details: { userId: user.id } });

    res.status(200).json({ status: 'success', message: 'Token sent to email!' });

    sendEmail({ email: user.email, subject: 'Password Reset Request', template: 'reset-password', context: { firstName: user.firstName, resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}` } })
      .then(() => AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Password reset email sent', details: { resourceType: 'email', resourceId: user.id, requestMethod: 'POST', requestPath: '/api/v1/auth/forgot-password' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }))
      .catch(emailError => {
        logger.error({ actionType: 'EMAIL_FAILED', message: 'Password reset email failed', req, details: { error: emailError.message } });
        AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Failed to send password reset email', details: { resourceType: 'email', resourceId: user.id, errorMessage: emailError.message, requestMethod: 'POST', requestPath: '/api/v1/auth/forgot-password' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      });
  } catch (error) {
    logger.error({ actionType: 'FORGOT_PASSWORD_FAILED', message: 'Failed to send password reset token', req, details: { error: error.message } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const newPassword = req.body.newPassword ?? req.body.password;
    const { user, token, refreshToken } = await authService.resetPassword(req.params.token, newPassword);
    logger.info({ actionType: 'RESET_PASSWORD', message: `Password reset for user: ${user.email}`, req, details: { userId: user.id } });
    await logAuthAction(req, 'PASSWORD_CHANGE', user.id);
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', token });
  } catch (error) {
    logger.error({ actionType: 'RESET_PASSWORD_FAILED', message: 'Failed to reset password', req, details: { error: error.message } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { newAccessToken } = await authService.refreshAccessToken(req.cookies?.refreshToken);
    res.status(200).json({ status: 'success', token: newAccessToken });
  } catch (error) {
    logger.error({ actionType: 'REFRESH_TOKEN_FAILED', message: 'Failed to refresh token', req, details: { error: error.message } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.refreshToken);
    clearRefreshTokenCookie(res);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ actionType: 'LOGOUT_FAILED', message: 'Failed to logout', req, details: { error: error.message } });
    next(error);
  }
};

const exportUserData = async (req, res, next) => {
  try {
    const user = await authService.exportUserData(req.user.id);
    logger.info({ actionType: 'DATA_EXPORT', message: `User data exported: ${user.email}`, req, details: { userId: user.id } });
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${user.id}_data_export.json`);
    res.status(200).send(JSON.stringify(user, null, 2));
  } catch (error) {
    logger.error({ actionType: 'DATA_EXPORT_FAILED', message: 'Failed to export user data', req, details: { error: error.message } });
    if (error.status === 404) return res.status(404).json({ status: 'error', message: error.message });
    next(error);
  }
};

const deleteUserAccount = async (req, res, next) => {
  try {
    await AuditLog.create({ userId: req.user.id, actionType: 'SYSTEM', description: 'User deleted own account', details: { resourceType: 'user', resourceId: req.user.id, requestMethod: req.method, requestPath: req.path }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    const user = await authService.deleteUserAccount(req.user.id);
    logger.info({ actionType: 'ACCOUNT_DELETION', message: `User account deleted: ${user.email}`, req, details: { userId: user.id } });
    clearRefreshTokenCookie(res);
    res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
  } catch (error) {
    logger.error({ actionType: 'ACCOUNT_DELETION_FAILED', message: 'Failed to delete user account', req, details: { error: error.message } });
    if (error.status === 404) return res.status(404).json({ status: 'error', message: error.message });
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { user, emailToken } = await authService.resendVerificationEmail(req.body.email);

    res.status(200).json({ status: 'success', message: 'Verification email sent' });

    sendEmail({ email: user.email, subject: 'Verify Your Email Address', template: 'welcome-verify', context: { firstName: user.firstName, verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailToken}` } })
      .then(() => {
        logger.info({ actionType: 'VERIFICATION_EMAIL_RESENT', message: `Verification email resent to: ${user.email}`, req, details: { userId: user.id } });
        return AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Verification email resent', details: { resourceType: 'email', resourceId: user.id, requestMethod: 'POST', requestPath: '/api/v1/auth/resend-verification' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      })
      .catch(emailError => {
        logger.error({ actionType: 'EMAIL_FAILED', message: 'Resend verification email failed', req, details: { error: emailError.message } });
        AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Failed to resend verification email', details: { resourceType: 'email', resourceId: user.id, errorMessage: emailError.message, requestMethod: 'POST', requestPath: '/api/v1/auth/resend-verification' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
      });
  } catch (error) {
    logger.error({ actionType: 'RESEND_VERIFICATION_FAILED', message: 'Failed to resend verification email', req, details: { error: error.message } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const user = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    logger.info({ actionType: 'PASSWORD_CHANGE', message: `Password changed for user: ${user.email || user.studentCode}`, req, details: { userId: user.id } });
    await logAuthAction(req, 'PASSWORD_CHANGE', user.id);
    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    logger.error({ actionType: 'PASSWORD_CHANGE_FAILED', message: 'Failed to change password', req, details: { error: error.message } });
    if (error.status) return res.status(error.status).json({ status: 'error', message: error.message });
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
  refreshToken,
  logout,
  exportUserData,
  deleteUserAccount,
  changePassword,
};

const authService = require('../services/auth.service');
const { AuditLog } = require('../models');
const { logAuthAction } = require('../middleware/authentication.middleware');
const { sendEmail } = require('../config/email.config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors/appError');

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 1000,
  path: '/api/v1'
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth'
  });
};

const setAccessTokenCookie = (res, token) => {
  res.cookie('accessToken', token, ACCESS_COOKIE_OPTIONS);
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { path: '/api/v1/auth', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
};

const clearAccessTokenCookie = (res) => {
  res.clearCookie('accessToken', { ...ACCESS_COOKIE_OPTIONS, maxAge: undefined });
};

const resolveFrontendBaseUrl = (req) => {
  const configuredFrontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
  const forwardedProto = (req.get('x-forwarded-proto') || '').split(',')[0]?.trim();
  const hostProtocol = forwardedProto || req.protocol;
  const hostBasedUrl = `${hostProtocol}://${req.get('host')}`;
  const shouldFallbackToHost = process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(configuredFrontendUrl);
  return configuredFrontendUrl && !shouldFallbackToHost ? configuredFrontendUrl : hostBasedUrl;
};

const createEmailAudit = async (req, user, description, details = {}) => {
  await AuditLog.create({
    userId: user.id,
    actionType: 'SYSTEM',
    description,
    details: {
      resourceType: 'email',
      resourceId: user.id,
      requestMethod: req.method,
      requestPath: req.originalUrl || req.path,
      ...details
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }).catch(() => {});
};

const sendVerificationEmail = async (req, user, emailToken, { subject, successDescription, failureDescription, successLogMessage, failureLogMessage }) => {
  const frontendBaseUrl = resolveFrontendBaseUrl(req);

  try {
    const delivery = await sendEmail({
      email: user.email,
      subject,
      template: 'welcome-verify',
      context: {
        firstName: user.firstName || 'Student',
        lastName: user.lastName || '',
        email: user.email,
        region: user.region,
        verificationUrl: `${frontendBaseUrl}/verify-email/${emailToken}`
      }
    });

    logger.info({
      actionType: 'SYSTEM',
      message: successLogMessage,
      req,
      details: { userId: user.id, attempts: delivery.attempts, messageId: delivery.messageId }
    });
    await createEmailAudit(req, user, successDescription, {
      messageId: delivery.messageId,
      attempts: delivery.attempts
    });

    return { sent: true, delivery };
  } catch (emailError) {
    logger.error({
      actionType: 'EMAIL_FAILED',
      message: failureLogMessage,
      req,
      details: { error: emailError.message }
    });
    await createEmailAudit(req, user, failureDescription, {
      errorMessage: emailError.message
    });

    return { sent: false, error: emailError };
  }
};

const register = async (req, res, next) => {
  try {
    const { user, emailToken } = await authService.register(req.body);
    logger.info({ actionType: 'REGISTER', message: `User registered: ${user.email}`, req, details: { email: user.email, role: user.role } });
    await logAuthAction(req, 'REGISTER', user.id);

    let emailResult = { sent: false };
    if (user.email) {
      emailResult = await sendVerificationEmail(req, user, emailToken, {
        subject: 'Welcome to SDS Test System - Verify Your Email',
        successDescription: 'Welcome email sent',
        failureDescription: 'Failed to send welcome email',
        successLogMessage: `Welcome verification email sent to: ${user.email}`,
        failureLogMessage: 'Welcome email failed'
      });
    }

    const verificationEmailSent = Boolean(emailResult.sent);
    res.status(201).json({
      status: 'success',
      message: verificationEmailSent
        ? 'Account created. Please verify your email to continue.'
        : 'Account created, but the verification email could not be sent right now. Please use resend verification link.',
      requiresEmailVerification: true,
      verificationEmailSent,
      emailDelivery: verificationEmailSent ? 'sent' : 'failed',
      data: {
        user: user.toJSON(),
        emailDelivery: verificationEmailSent
          ? { attempts: emailResult.delivery.attempts }
          : null
      }
    });
  } catch (error) {
    logger.error({ actionType: 'REGISTER_FAILED', message: 'User registration failed', req, details: { error: error.message, stack: error.stack } });
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { user, token, refreshToken, alreadyVerified } = await authService.verifyEmail(req.params.token);
    if (!alreadyVerified) {
      logger.info({ actionType: 'VERIFY_EMAIL', message: `Email verified for user: ${user.email}`, req, details: { userId: user.id } });
      await AuditLog.create({ userId: user.id, actionType: 'SYSTEM', description: 'Email verified', details: { resourceType: 'user', resourceId: user.id, requestMethod: 'GET', requestPath: '/api/v1/auth/verify-email/[REDACTED]' }, ipAddress: req.ip, userAgent: req.headers['user-agent'] }).catch(() => {});
    }
    if (token) setAccessTokenCookie(res, token);
    if (refreshToken) setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', message: alreadyVerified ? 'Your email is already verified. Please log in.' : (token ? 'Email successfully verified!' : 'Email successfully verified. Please log in.'), ...(token ? { token } : {}), data: { user: user.toJSON() } });
  } catch (error) {
    logger.error({ actionType: 'VERIFY_EMAIL_FAILED', message: 'Email verification failed', req, details: { error: error.message, stack: error.stack } });
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
    setAccessTokenCookie(res, token);
    res.status(200).json({ status: 'success', token, mustChangePassword, data: { user: user.toJSON ? user.toJSON() : user } });
  } catch (error) {
    logger.log({
      level: 'warn',
      actionType: 'LOGIN_FAILED',
      message: error.message,
      req,
      details: { code: error.code, status: error.status || error.statusCode }
    });
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
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier || req.body.email || '').trim();
    const { user, resetToken } = await authService.forgotPassword(identifier);

    const configuredFrontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');
    const forwardedProto = (req.get('x-forwarded-proto') || '').split(',')[0]?.trim();
    const hostProtocol = forwardedProto || req.protocol;
    const hostBasedUrl = `${hostProtocol}://${req.get('host')}`;
    const shouldFallbackToHost = process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/i.test(configuredFrontendUrl);
    const resetUrlBase = configuredFrontendUrl && !shouldFallbackToHost ? configuredFrontendUrl : hostBasedUrl;
    const resetUrl = `${resetUrlBase}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      template: 'reset-password',
      context: {
        firstName: user.firstName || 'Student',
        resetUrl
      }
    });

    await AuditLog.create({
      userId: user.id,
      actionType: 'SYSTEM',
      description: 'Password reset email sent',
      details: {
        resourceType: 'email',
        resourceId: user.id,
        requestMethod: 'POST',
        requestPath: '/api/v1/auth/forgot-password'
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});

    logger.info({
      actionType: 'FORGOT_PASSWORD',
      message: `Password reset email sent to: ${user.email}`,
      req,
      details: { userId: user.id, resetUrlBase }
    });

    res.status(200).json({ status: 'success', message: 'Reset link sent to email!' });
  } catch (error) {
    logger.error({ actionType: 'FORGOT_PASSWORD_FAILED', message: 'Failed to send password reset token', req, details: { error: error.message } });
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
    setAccessTokenCookie(res, token);
    res.status(200).json({ status: 'success', token });
  } catch (error) {
    logger.error({ actionType: 'RESET_PASSWORD_FAILED', message: 'Failed to reset password', req, details: { error: error.message } });
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { newAccessToken } = await authService.refreshAccessToken(req.cookies?.refreshToken);
    setAccessTokenCookie(res, newAccessToken);
    res.status(200).json({ status: 'success', token: newAccessToken });
  } catch (error) {
    logger.error({ actionType: 'REFRESH_TOKEN_FAILED', message: 'Failed to refresh token', req, details: { error: error.message } });
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.cookies?.refreshToken);
    clearRefreshTokenCookie(res);
    clearAccessTokenCookie(res);
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
    next(error);
  }
};

const deleteUserAccount = async (req, res, next) => {
  try {
    await AuditLog.create({ userId: req.user.id, actionType: 'SYSTEM', description: 'User deleted own account', details: { resourceType: 'user', resourceId: req.user.id, requestMethod: req.method, requestPath: req.path }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    const user = await authService.deleteUserAccount(req.user.id);
    logger.info({ actionType: 'ACCOUNT_DELETION', message: `User account deleted: ${user.email}`, req, details: { userId: user.id } });
    clearRefreshTokenCookie(res);
    clearAccessTokenCookie(res);
    res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
  } catch (error) {
    logger.error({ actionType: 'ACCOUNT_DELETION_FAILED', message: 'Failed to delete user account', req, details: { error: error.message } });
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { user, emailToken, previousVerification } = await authService.resendVerificationEmail(req.body.email);

    const emailResult = await sendVerificationEmail(req, user, emailToken, {
      subject: 'Verify Your Email Address',
      successDescription: 'Verification email resent',
      failureDescription: 'Failed to resend verification email',
      successLogMessage: `Verification email resent to: ${user.email}`,
      failureLogMessage: 'Resend verification email failed'
    });

    if (!emailResult.sent) {
      await user.update({
        emailVerificationToken: previousVerification.token,
        emailVerificationExpires: previousVerification.expires
      }).catch(() => {});
      throw new AppError('We could not send the verification email right now. Please wait a moment and try again.', {
        status: 503,
        code: 'EMAIL_DELIVERY_FAILED',
        expose: true
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent',
      emailDelivery: 'sent',
      data: {
        emailDelivery: { attempts: emailResult.delivery.attempts }
      }
    });
  } catch (error) {
    logger.error({ actionType: 'RESEND_VERIFICATION_FAILED', message: 'Failed to resend verification email', req, details: { error: error.message } });
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

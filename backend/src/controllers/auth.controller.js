const authService = require('../services/auth.service');
const { AuditLog } = require('../models');
const { logAuthAction } = require('../middleware/authentication.middleware');
const { sendEmail } = require('../config/email.config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errors/appError');
const { maskEmailForLog } = require('../utils/security.util');

/**
 * Cookie strategy (2026 SPA best practice + OWASP Session Management):
 *   - HttpOnly + Secure (prod) + SameSite=Strict on both tokens
 *   - 15-minute access token; refresh chains keep the session alive
 *   - Refresh-token cookie is path-scoped to /api/v1/auth (only the
 *     refresh endpoint will ever receive it)
 *
 * SameSite=Strict implies SPA + API must share a registrable site in
 * production. If the deployment splits them across sites, switch to 'lax'
 * AND add a CSRF double-submit token — see H-6 in the audit notes.
 */
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const isProd = () => process.env.NODE_ENV === 'production';
const isCookieSecure = () => isProd();

const sameSiteSetting = () => (process.env.COOKIE_SAMESITE || 'strict').toLowerCase();

const ACCESS_COOKIE_OPTIONS = () => ({
  httpOnly: true,
  secure: isCookieSecure(),
  sameSite: sameSiteSetting(),
  maxAge: ACCESS_TOKEN_TTL_MS,
  path: '/api/v1'
});

const REFRESH_COOKIE_OPTIONS = () => ({
  httpOnly: true,
  secure: isCookieSecure(),
  sameSite: sameSiteSetting(),
  maxAge: REFRESH_TOKEN_TTL_MS,
  path: '/api/v1/auth'
});

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, REFRESH_COOKIE_OPTIONS());
};

const setAccessTokenCookie = (res, token) => {
  res.cookie('accessToken', token, ACCESS_COOKIE_OPTIONS());
};

const clearRefreshTokenCookie = (res) => {
  res.clearCookie('refreshToken', { ...REFRESH_COOKIE_OPTIONS(), maxAge: undefined });
};

const clearAccessTokenCookie = (res) => {
  res.clearCookie('accessToken', { ...ACCESS_COOKIE_OPTIONS(), maxAge: undefined });
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

const sendVerificationEmail = async (req, user, emailOtp, { subject, successDescription, failureDescription, successLogMessage, failureLogMessage }) => {
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
        verificationOtp: emailOtp,
        verificationUrl: `${frontendBaseUrl}/verify-otp`
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
    const { user, emailOtp } = await authService.register(req.body);
    logger.info({ actionType: 'REGISTER', message: `User registered: ${maskEmailForLog(user.email)}`, req, details: { emailHint: maskEmailForLog(user.email), role: user.role } });
    await logAuthAction(req, 'REGISTER', user.id);

    let emailResult = { sent: false };
    if (user.email) {
      emailResult = await sendVerificationEmail(req, user, emailOtp, {
        subject: 'Welcome to SDS Test System - Verify Your Email',
        successDescription: 'Welcome email sent',
        failureDescription: 'Failed to send welcome email',
        successLogMessage: `Welcome verification email sent to: ${maskEmailForLog(user.email)}`,
        failureLogMessage: 'Welcome email failed'
      });
    }

    const verificationEmailSent = Boolean(emailResult.sent);
    res.status(201).json({
      status: 'success',
      message: verificationEmailSent
        ? 'Account created. Enter the verification code we just emailed you to continue.'
        : 'Account created, but the verification code could not be sent right now. Please request a new code.',
      requiresEmailVerification: true,
      verificationEmailSent,
      emailDelivery: verificationEmailSent ? 'sent' : 'failed',
      data: {
        user: user.toJSON(),
        email: user.email,
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
    const { user, token, refreshToken } = await authService.verifyEmail({
      email: req.body.email,
      otp: req.body.otp
    });
    if (token) setAccessTokenCookie(res, token);
    if (refreshToken) setRefreshTokenCookie(res, refreshToken);
    logger.info({ actionType: 'VERIFY_EMAIL', message: `Email verified for user: ${maskEmailForLog(user.email)}`, req, details: { userId: user.id } });
    await AuditLog.create({
      userId: user.id,
      actionType: 'SYSTEM',
      description: 'Email verified',
      details: { resourceType: 'user', resourceId: user.id, requestMethod: 'POST', requestPath: '/api/v1/auth/verify-email' },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});
    res.status(200).json({
      status: 'success',
      message: 'Email successfully verified.',
      ...(token ? { token } : {}),
      data: { user: user.toJSON() }
    });
  } catch (error) {
    logger.warn({
      actionType: 'VERIFY_EMAIL_FAILED',
      message: 'Email verification failed',
      req,
      details: {
        code: error.code,
        emailHint: maskEmailForLog(String(req.body?.email || '').trim().toLowerCase()) || null
      }
    });
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const identifier = (req.body.identifier ?? req.body.email ?? req.body.username ?? '').toString().trim();
    const { user, token, refreshToken, mustChangePassword } = await authService.login(identifier, req.body.password);
    setRefreshTokenCookie(res, refreshToken);
    setAccessTokenCookie(res, token);
    logger.info({ actionType: 'LOGIN', message: `User logged in: ${maskEmailForLog(user.email)}`, req, details: { userId: user.id } });
    await logAuthAction(req, 'LOGIN', user.id);
    res.status(200).json({ status: 'success', token, mustChangePassword, data: { user: user.toJSON ? user.toJSON() : user } });
  } catch (error) {
    if (error?.code === 'ACCOUNT_LOCKED' && error.retryAfterSec) {
      res.setHeader('Retry-After', String(error.retryAfterSec));
    }
    // Persist failed-login attempts to the audit trail (DatabaseTransport
    // only writes rows for allowlisted actionTypes; SYSTEM is the catchall).
    logger.log({
      level: 'warn',
      actionType: 'SYSTEM',
      message: `LOGIN_FAILED: ${error.message}`,
      req,
      details: {
        code: error.code,
        status: error.status || error.statusCode,
        identifierHint: maskEmailForLog((req.body?.identifier || req.body?.email || '').toString().trim()) || null
      }
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
  // Always returns the same generic body so the endpoint can't be used to
  // enumerate registered identifiers.
  const genericResponse = {
    status: 'success',
    message: 'If an account exists for that identifier, we have sent reset instructions to its registered email.'
  };

  try {
    const identifier = (req.body.identifier || req.body.email || '').trim();
    const { shouldSend, user, resetToken } = await authService.forgotPassword(identifier);

    if (!shouldSend) {
      logger.info({
        actionType: 'FORGOT_PASSWORD_NOOP',
        message: 'Password reset requested for unknown identifier or account without email',
        req,
        details: { identifierHint: maskEmailForLog(identifier) || null }
      });
      return res.status(200).json(genericResponse);
    }

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
      message: `Password reset email sent to: ${maskEmailForLog(user.email)}`,
      req,
      details: { userId: user.id, resetUrlBase }
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    logger.error({ actionType: 'FORGOT_PASSWORD_FAILED', message: 'Failed to send password reset token', req, details: { error: error.message } });
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    // Prefer the token in the request body — keeps it out of access logs and
    // referrer headers. We still accept the legacy `/reset-password/:token`
    // path for back-compat with any reset emails already in inboxes.
    const tokenFromBody = typeof req.body?.token === 'string' ? req.body.token : null;
    const tokenFromParam = typeof req.params?.token === 'string' ? req.params.token : null;
    const tokenValue = (tokenFromBody || tokenFromParam || '').trim();
    if (!tokenValue) {
      return next(new AppError('Reset token is required.', { status: 400, code: 'INVALID_TOKEN', expose: true }));
    }
    const newPassword = req.body.newPassword ?? req.body.password;
    const { user, token, refreshToken: newRT } = await authService.resetPassword(tokenValue, newPassword);
    setRefreshTokenCookie(res, newRT);
    setAccessTokenCookie(res, token);
    logger.info({ actionType: 'RESET_PASSWORD', message: `Password reset for user: ${maskEmailForLog(user.email)}`, req, details: { userId: user.id } });
    await logAuthAction(req, 'PASSWORD_CHANGE', user.id);
    res.status(200).json({ status: 'success', token });
  } catch (error) {
    logger.error({ actionType: 'RESET_PASSWORD_FAILED', message: 'Failed to reset password', req, details: { code: error.code, error: error.message } });
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { newAccessToken, newRefreshToken, reuseDetected } = await authService.refreshAccessToken(req.cookies?.refreshToken);
    if (reuseDetected) {
      clearRefreshTokenCookie(res);
      clearAccessTokenCookie(res);
    }
    setAccessTokenCookie(res, newAccessToken);
    if (newRefreshToken) setRefreshTokenCookie(res, newRefreshToken);
    res.status(200).json({ status: 'success', token: newAccessToken });
  } catch (error) {
    if (error?.code === 'REFRESH_TOKEN_REUSED') {
      clearRefreshTokenCookie(res);
      clearAccessTokenCookie(res);
      logger.warn({
        actionType: 'SYSTEM',
        message: 'Refresh-token reuse detected — session revoked',
        req,
        details: { code: error.code }
      });
    } else {
      logger.error({ actionType: 'REFRESH_TOKEN_FAILED', message: 'Failed to refresh token', req, details: { code: error.code, error: error.message } });
    }
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
    const { snapshot } = await authService.deleteUserAccount(req.user.id);
    await AuditLog.create({
      userId: snapshot.id,
      actionType: 'SYSTEM',
      description: 'User soft-deleted own account (PII scrubbed)',
      details: {
        resourceType: 'user',
        resourceId: snapshot.id,
        requestMethod: req.method,
        requestPath: req.path,
        emailHint: maskEmailForLog(snapshot.email),
        role: snapshot.role
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    }).catch(() => {});
    logger.info({ actionType: 'SYSTEM', message: `User account soft-deleted (PII scrubbed): ${maskEmailForLog(snapshot.email)}`, req, details: { userId: snapshot.id } });
    clearRefreshTokenCookie(res);
    clearAccessTokenCookie(res);
    res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
  } catch (error) {
    logger.error({ actionType: 'SYSTEM', message: 'Failed to delete user account', req, details: { error: error.message } });
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  // Always returns the same generic body — does not reveal whether the email is
  // registered, already verified, or being throttled. Prevents account
  // enumeration AND timing-based introspection of the per-account rate limit.
  const genericResponse = {
    status: 'success',
    message: 'If an account with that email exists and is unverified, a new verification code has been sent.'
  };

  try {
    const { shouldSend, user, emailOtp, previousVerification, throttled } = await authService.resendVerificationEmail(req.body.email);

    if (!shouldSend) {
      const reason = throttled
        ? 'throttled per-account (cooldown or daily cap)'
        : 'unknown email or already verified';
      logger.info({
        actionType: 'RESEND_VERIFICATION_NOOP',
        message: `Resend verification noop — ${reason}`,
        req,
        details: {
          throttled: Boolean(throttled),
          emailHint: maskEmailForLog(String(req.body?.email || '').trim().toLowerCase()) || null
        }
      });
      return res.status(200).json(genericResponse);
    }

    const emailResult = await sendVerificationEmail(req, user, emailOtp, {
      subject: 'Your SDS verification code',
      successDescription: 'Verification email resent',
      failureDescription: 'Failed to resend verification email',
      successLogMessage: `Verification code resent to: ${maskEmailForLog(user.email)}`,
      failureLogMessage: 'Resend verification email failed'
    });

    if (!emailResult.sent) {
      // Restore the user's prior throttling state so this failed delivery
      // doesn't unfairly consume a slot in their daily cap.
      await user.update({
        emailVerificationToken: previousVerification.token,
        emailVerificationExpires: previousVerification.expires,
        emailVerificationAttempts: previousVerification.attempts,
        emailVerificationLastSentAt: previousVerification.lastSentAt,
        emailVerificationResendCount: previousVerification.resendCount,
        emailVerificationResendWindowStartedAt: previousVerification.resendWindowStartedAt
      }).catch(() => {});
      throw new AppError('We could not send the verification code right now. Please wait a moment and try again.', {
        status: 503,
        code: 'EMAIL_DELIVERY_FAILED',
        expose: true
      });
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    logger.error({ actionType: 'SYSTEM', message: 'Failed to resend verification email', req, details: { error: error.message } });
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken: newRT } = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    setRefreshTokenCookie(res, newRT);
    setAccessTokenCookie(res, accessToken);
    logger.info({ actionType: 'PASSWORD_CHANGE', message: `Password changed for user: ${maskEmailForLog(user.email) || user.studentCode}`, req, details: { userId: user.id } });
    await logAuthAction(req, 'PASSWORD_CHANGE', user.id);
    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  } catch (error) {
    logger.error({ actionType: 'SYSTEM', message: 'Failed to change password', req, details: { code: error.code, error: error.message } });
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

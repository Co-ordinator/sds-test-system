const logger = require('../utils/logger');
const { AppError } = require('../utils/errors/appError');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');
  const requestId = req.requestId || null;
  const isOperational = err instanceof AppError || (statusCode < 500 && !!err.message);
  const safeMessage = (isOperational && (err.expose || statusCode < 500))
    ? err.message
    : 'An internal server error occurred.';
  const responseBody = {
    status: 'error',
    code,
    message: safeMessage,
    requestId
  };
  if (code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
    responseBody.details = err.details;
  }
  if (err.requiresVerification) {
    responseBody.requiresVerification = true;
  }
  if (Number.isFinite(err.resendAvailableInSeconds)) {
    responseBody.resendAvailableInSeconds = err.resendAvailableInSeconds;
  }

  const logPayload = {
    actionType: 'SYSTEM',
    message: `${code}: ${err.message}`,
    req,
    details: {
      code,
      statusCode,
      requestId,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    }
  };

  const routineSessionCodes = new Set([
    'ACCESS_TOKEN_MISSING',
    'ACCESS_TOKEN_EXPIRED',
    'REFRESH_TOKEN_MISSING',
    'INVALID_REFRESH_TOKEN'
  ]);
  const isLegacyUnauthenticatedProbe =
    code === 'REQUEST_ERROR' &&
    String(req.originalUrl || req.url || '').includes('/api/v1/auth/me');
  const isExpectedUnauthenticatedSession =
    statusCode === 401 &&
    (routineSessionCodes.has(code) || isLegacyUnauthenticatedProbe);
  if (statusCode >= 500) {
    logger.error(logPayload);
  } else if (isExpectedUnauthenticatedSession) {
    logger.debug(logPayload);
  } else {
    logger.warn(logPayload);
  }

  return res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;

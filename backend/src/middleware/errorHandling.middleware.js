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

  logger.error({
    actionType: 'SYSTEM',
    message: `${code}: ${err.message}`,
    req,
    details: {
      code,
      statusCode,
      requestId,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    }
  });

  return res.status(statusCode).json(responseBody);
};

module.exports = errorHandler;

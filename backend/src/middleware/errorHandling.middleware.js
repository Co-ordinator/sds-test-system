const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV === 'production') {
    if (statusCode >= 500) {
      logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user?.id || 'anonymous'
      });
    }
    const message = statusCode >= 500 ? 'An internal server error occurred.' : err.message;
    return res.status(statusCode).json({
      status: 'error',
      message
    });
  }

  logger.error(err.stack);
  return res.status(statusCode).json({
    status: 'error',
    message: err.message,
    ...(statusCode >= 500 && { stack: err.stack })
  });
};

module.exports = errorHandler;

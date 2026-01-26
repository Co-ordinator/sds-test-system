const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    userId: req.user?.id || null,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestMethod: req.method,
    requestPath: req.path,
    statusCode: err.status || 500
  });

  // Determine response status
  const status = err.status || 500;
  
  // Prepare error response
  const response = {
    status: 'error',
    message: status === 500 ? 'Internal Server Error' : err.message
  };

  // Include validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorMiddleware;

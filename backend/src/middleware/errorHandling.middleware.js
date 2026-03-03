const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    logger.error({
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user?.id || 'anonymous'
    });
    
    return res.status(500).json({
      status: 'error',
      message: 'An internal server error occurred.'
    });
  } else {
    logger.error(err.stack);
    
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      error: err
    });
  }
};

module.exports = errorHandler;

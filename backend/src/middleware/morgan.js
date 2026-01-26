const morgan = require('morgan');
const logger = require('../utils/logger');

// Custom Morgan format
const morganFormat = (tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)}ms`,
    remoteAddr: tokens['remote-addr'](req, res),
    userId: req.user?.id || null,
    userAgent: tokens['user-agent'](req, res),
    contentLength: tokens.res(req, res, 'content-length')
  });
};

// Middleware to log HTTP requests
const morganMiddleware = morgan(morganFormat, {
  stream: {
    write: (message) => {
      const data = JSON.parse(message);
      logger.http('HTTP request', data);
    }
  }
});

module.exports = morganMiddleware;

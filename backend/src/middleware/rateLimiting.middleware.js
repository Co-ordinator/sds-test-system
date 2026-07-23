const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (isDevelopment || isTest) return true;
    return String(req.originalUrl || req.url || '').startsWith('/api/v1/auth/');
  }
};

const apiLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: {
    status: 'error',
    message: 'Too many API requests from this IP, please try again after 15 minutes'
  }
});

module.exports = { apiLimiter };

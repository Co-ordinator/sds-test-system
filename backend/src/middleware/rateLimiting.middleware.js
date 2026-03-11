const rateLimit = require('express-rate-limit');

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDevelopment || isTest
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

const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: {
    status: 'error',
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes'
  }
});

module.exports = { apiLimiter, authLimiter };

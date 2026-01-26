const jwt = require('jsonwebtoken');
const { AuditLog } = require('../models');

// Error handler for JWT verification
const handleJWTError = () => {
  const error = new Error('Invalid token');
  error.status = 401;
  return error;
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(handleJWTError());
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return next(handleJWTError());
  }
};

// Role-based access control
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error('Unauthorized access');
      error.status = 403;
      return next(error);
    }
    next();
  };
};

// Log authentication actions
const logAuthAction = async (req, actionType) => {
  await AuditLog.create({
    userId: req.user?.id,
    action: actionType,
    resourceType: 'auth',
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    requestMethod: req.method,
    requestPath: req.path
  });
};

module.exports = {
  verifyToken,
  restrictTo,
  logAuthAction
};

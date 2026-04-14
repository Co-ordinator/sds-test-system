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
  const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken;

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

// Log authentication actions (AuditLog schema: actionType, description, details)
// optionalUserId: use when the acting user is not in req.user (e.g. REGISTER)
const logAuthAction = async (req, actionType, optionalUserId = null) => {
  await AuditLog.create({
    userId: optionalUserId ?? req.user?.id ?? null,
    actionType,
    description: `Auth action: ${actionType}`,
    details: {
      resourceType: 'auth',
      requestMethod: req.method,
      requestPath: req.path
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });
};

module.exports = {
  verifyToken,
  restrictTo,
  logAuthAction
};

const { AuditLog } = require('../models');

const authorize = (allowedRoles = []) => {
  return async (req, res, next) => {
    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt (AuditLog schema: actionType, description, details)
      await AuditLog.create({
        userId: req.user.id,
        actionType: 'ACCESS_DENIED',
        description: 'Unauthorized access attempt',
        details: {
          resourceType: req.baseUrl + req.path,
          resourceId: req.params.id,
          requestMethod: req.method,
          isSuspicious: true
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});

      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Middleware to ensure users can only access their own data
const selfOnly = (resourceType) => {
  return async (req, res, next) => {
    const resourceId = req.params.userId || req.params.id;
    
    // Allow admins and counselors to bypass
    if (req.user.role === 'admin' || req.user.role === 'counselor') {
      return next();
    }

    // Check if user is accessing their own data
    if (resourceId !== req.user.id) {
      await AuditLog.create({
        userId: req.user.id,
        actionType: 'ACCESS_DENIED',
        description: 'Unauthorized access to resource',
        details: {
          resourceType,
          resourceId,
          requestMethod: req.method,
          isSuspicious: true
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});

      return res.status(403).json({
        status: 'error',
        message: 'You can only access your own data'
      });
    }

    next();
  };
};

// Prevent self-deletion for admins
const preventSelfDeletion = (req, res, next) => {
  if (req.user.id === req.params.id && req.user.role === 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admins cannot delete their own accounts'
    });
  }
  next();
};

module.exports = {
  authorize,
  selfOnly,
  preventSelfDeletion
};

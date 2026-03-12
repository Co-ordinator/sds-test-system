const { User, Permission, AuditLog } = require('../models');

/**
 * Enterprise RBAC permission middleware.
 * Loads user permissions from DB and checks against required permission code(s).
 *
 * Usage:
 *   requirePermission('users.create')
 *   requirePermission(['users.create', 'users.update'])   // any of these
 */
const requirePermission = (requiredPermissions) => {
  const perms = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ status: 'error', message: 'Authentication required' });
      }

      // Load user with permissions from DB (cached on request for repeated checks)
      if (!req._permissionCodes) {
        const user = await User.findByPk(req.user.id, {
          include: [{ model: Permission, as: 'permissions', attributes: ['code'], through: { attributes: [] } }]
        });

        if (!user) {
          return res.status(401).json({ status: 'error', message: 'User not found' });
        }

        req._permissionCodes = new Set((user.permissions || []).map(p => p.code));
      }

      // Check if user has ANY of the required permissions
      const hasPermission = perms.some(p => req._permissionCodes.has(p));

      if (!hasPermission) {
        await AuditLog.create({
          userId: req.user.id,
          actionType: 'PERMISSION_DENIED',
          description: `Permission denied: requires ${perms.join(' | ')}`,
          details: {
            resourceType: req.baseUrl + req.path,
            requestMethod: req.method,
            requiredPermissions: perms,
            isSuspicious: false
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
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Utility to load permissions for a user (for auth/me responses).
 * Returns flat array of permission code strings.
 */
const loadUserPermissions = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }]
  });
  return user?.permissions || [];
};

module.exports = { requirePermission, loadUserPermissions };

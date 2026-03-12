import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext({ permissions: [], hasPermission: () => false, hasAnyPermission: () => false, hasAllPermissions: () => false });

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();

  const permissionCodes = useMemo(() => {
    if (!user?.permissions) return new Set();
    return new Set(user.permissions.map(p => p.code || p));
  }, [user?.permissions]);

  const hasPermission = (code) => permissionCodes.has(code);

  const hasAnyPermission = (codes) => {
    if (!Array.isArray(codes)) return hasPermission(codes);
    return codes.some(c => permissionCodes.has(c));
  };

  const hasAllPermissions = (codes) => {
    if (!Array.isArray(codes)) return hasPermission(codes);
    return codes.every(c => permissionCodes.has(c));
  };

  const value = useMemo(() => ({
    permissions: user?.permissions || [],
    permissionCodes: [...permissionCodes],
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }), [permissionCodes]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionContext);

/**
 * PermissionGate — conditionally renders children based on permission(s).
 *
 * Usage:
 *   <PermissionGate permission="users.create">
 *     <button>Create User</button>
 *   </PermissionGate>
 *
 *   <PermissionGate permissions={['users.create', 'users.update']} requireAll={false}>
 *     <button>Edit</button>
 *   </PermissionGate>
 */
export const PermissionGate = ({ permission, permissions, requireAll = false, fallback = null, children }) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissions) {
    allowed = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  } else {
    allowed = true;
  }

  return allowed ? children : fallback;
};

export default PermissionContext;

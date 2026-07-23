export const roleDashboardPath = (role) => {
  if (role === 'System Administrator') return '/admin/dashboard';
  if (role === 'Test Administrator') return '/test-administrator';
  return '/dashboard';
};

export const resolveHelpBackTarget = ({ historyIndex, isAuthenticated, role }) => {
  if (Number(historyIndex) > 0) return -1;
  return isAuthenticated ? roleDashboardPath(role) : '/';
};

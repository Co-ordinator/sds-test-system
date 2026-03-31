/**
 * Display label for admin user lists / breadcrumbs when first/last may be null.
 */
export function adminUserDisplayName(user) {
  if (!user) return 'User Details';
  const name = [user.firstName, user.lastName]
    .filter((p) => p != null && String(p).trim())
    .join(' ')
    .trim();
  if (name) return name;
  if (user.email) return user.email;
  if (user.username) return user.username;
  if (user.studentCode) return user.studentCode;
  return 'User';
}

export function adminUserInitials(user) {
  if (!user) return '?';
  const a = user.firstName?.trim?.()[0];
  const b = user.lastName?.trim?.()[0];
  if (a || b) return `${(a || '').toUpperCase()}${(b || '').toUpperCase()}`;
  const fromEmail = user.email?.trim?.()[0];
  if (fromEmail) return fromEmail.toUpperCase();
  return '?';
}

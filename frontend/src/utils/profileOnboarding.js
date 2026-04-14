/**
 * Test Takers must complete onboarding; completion is stored as `onboardingCompleted` on the user (server-set).
 * No placeholder first/last names — registration leaves names null until onboarding.
 */
export function profileNeedsOnboarding(user) {
  if (!user || user.role !== 'Test Taker') return false;

  // Explicit server flag always wins.
  if (user.onboardingCompleted === true) return false;
  if (user.onboardingCompleted === false) return true;

  // Legacy accounts may not have onboardingCompleted populated.
  // Infer completion from minimum profile identity/location fields.
  const hasName = Boolean((user.firstName || '').trim() && (user.lastName || '').trim());
  const hasRegion = Boolean((user.region || '').trim());
  const hasDistrict = Boolean((user.district || '').trim());
  if (!(hasName && hasRegion && hasDistrict)) return true;

  const userType = user.userType || '';
  if (userType === 'Professional') {
    return !Boolean((user.workplaceName || '').trim() || user.workplaceInstitutionId);
  }
  if (userType === 'High School Student' || userType === 'University Student') {
    return !Boolean((user.currentInstitution || '').trim() || user.institutionId);
  }

  return false;
}

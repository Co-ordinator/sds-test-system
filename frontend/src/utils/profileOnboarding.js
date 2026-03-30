/**
 * Test Takers must complete onboarding; completion is stored as `onboardingCompleted` on the user (server-set).
 * No placeholder first/last names — registration leaves names null until onboarding.
 */
export function profileNeedsOnboarding(user) {
  if (!user || user.role !== 'Test Taker') return false;
  return user.onboardingCompleted !== true;
}

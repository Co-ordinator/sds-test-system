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
  // Infer completion from the full onboarding profile.
  const hasName = Boolean((user.firstName || '').trim() && (user.lastName || '').trim());
  const hasGender = Boolean(user.gender);
  const hasUserType = Boolean(user.userType);
  const hasRegion = Boolean((user.region || '').trim());
  const hasDistrict = Boolean((user.district || '').trim());
  const hasAddress = Boolean((user.address || '').trim());
  const hasLanguage = Boolean(user.preferredLanguage);
  const hasGradeLevel = Boolean((user.gradeLevel || '').trim());
  if (!(hasName && hasGender && hasUserType && hasRegion && hasDistrict && hasAddress && hasLanguage && hasGradeLevel)) return true;

  const userType = user.userType || '';
  if (userType === 'Professional') {
    const hasWorkplace = Boolean((user.workplaceName || '').trim() || user.workplaceInstitutionId);
    const hasOccupation = Boolean((user.currentOccupation || '').trim() || user.currentOccupationId);
    const hasExperience = user.yearsExperience !== null && user.yearsExperience !== undefined && String(user.yearsExperience).trim() !== '';
    return !(hasWorkplace && hasOccupation && hasExperience);
  }
  if (userType === 'High School Student' || userType === 'University Student') {
    const hasInstitution = Boolean((user.currentInstitution || '').trim() || user.institutionId);
    if (userType === 'High School Student') return !hasInstitution;

    const hasDegreeProgram = Boolean((user.degreeProgram || '').trim());
    const hasYearOfStudy = user.yearOfStudy !== null && user.yearOfStudy !== undefined && String(user.yearOfStudy).trim() !== '';
    return !(hasInstitution && hasDegreeProgram && hasYearOfStudy);
  }

  return false;
}

export const canSelectAnyInstitution = (role) => role === 'System Administrator';

export const getAssignedInstitutionName = (user = {}) =>
  user?.institution?.name
  || user?.currentInstitution
  || user?.organization
  || 'Assigned institution';

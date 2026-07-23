'use strict';

const cleanSnapshotValue = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).trim();
  return cleaned || null;
};

const readValue = (source, key) => {
  if (!source) return null;
  const directValue = source[key];
  if (directValue !== null && directValue !== undefined) return directValue;
  if (typeof source.get === 'function') return source.get(key);
  return null;
};

const firstCleanValue = (...values) => {
  for (const value of values) {
    const cleaned = cleanSnapshotValue(value);
    if (cleaned !== null) return cleaned;
  }
  return null;
};

const isProfessionalUserType = (userType) => (
  String(userType || '').trim().toLowerCase().includes('professional')
);

const buildCertificateProfileSnapshot = (user) => {
  const userType = cleanSnapshotValue(readValue(user, 'userType'));
  const institution = readValue(user, 'institution');
  const workplace = readValue(user, 'workplace');
  const occupation = readValue(user, 'occupation');
  const isProfessional = isProfessionalUserType(userType);
  const locationSource = isProfessional ? workplace : institution;

  return {
    userType,
    institutionName: isProfessional ? null : firstCleanValue(
      readValue(institution, 'name'),
      readValue(user, 'currentInstitution')
    ),
    workplaceName: isProfessional ? firstCleanValue(
      readValue(workplace, 'name'),
      readValue(user, 'workplaceName')
    ) : null,
    occupationName: isProfessional ? firstCleanValue(
      readValue(occupation, 'name'),
      readValue(user, 'currentOccupation')
    ) : null,
    district: firstCleanValue(
      readValue(locationSource, 'district'),
      readValue(user, 'district')
    ),
    region: firstCleanValue(
      readValue(locationSource, 'region'),
      readValue(user, 'region')
    )
  };
};

module.exports = {
  buildCertificateProfileSnapshot
};

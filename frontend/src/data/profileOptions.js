export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const GRADE_LEVEL_OPTIONS = [
  'Lower Than High School',
  'High School Level',
  'A-Level',
  'IB Certificate',
  'Certificate / Diploma',
  "Bachelor's Degree",
  'Postgraduate',
];

export const LEGACY_GRADE_LEVEL_ALIASES = {
  'Form 3 (Junior Secondary)': 'Lower Than High School',
  'Form 5 / O-Level (Senior Secondary)': 'High School Level',
  "Bachelor's degree": "Bachelor's Degree",
};

export const GRADE_LEVEL_RANK = {
  'Lower Than High School': 1,
  'High School Level': 2,
  'A-Level': 2,
  'IB Certificate': 2,
  'Certificate / Diploma': 3,
  "Bachelor's Degree": 4,
  'Postgraduate': 5,
  'Form 3 (Junior Secondary)': 1,
  'Form 5 / O-Level (Senior Secondary)': 2,
  "Bachelor's degree": 4,
};

export const normalizeGradeLevel = (value) =>
  LEGACY_GRADE_LEVEL_ALIASES[value] || value || '';

export const educationPairError = ({ educationLevelId, gradeLevel, educationLevels }) => {
  if (!educationLevelId || !gradeLevel) return '';
  const selectedLevel = educationLevels.find((level) => level.id === educationLevelId);
  const gradeRank = GRADE_LEVEL_RANK[gradeLevel];
  if (!selectedLevel || !gradeRank || Number(selectedLevel.level) === gradeRank) return '';
  return `Education level and current or highest grade must describe the same level. "${gradeLevel}" does not match "${selectedLevel.description}".`;
};

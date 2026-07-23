'use strict';

const GRADE_TO_EDUCATION_LEVEL = Object.freeze({
  'Lower Than High School': 1,
  'High School Level': 2,
  'A-Level': 2,
  'IB Certificate': 2,
  'Certificate / Diploma': 3,
  "Bachelor's Degree": 4,
  'Postgraduate': 5,

  // Compatibility for records created before the QA terminology update.
  'Form 3 (Junior Secondary)': 1,
  'Form 5 / O-Level (Senior Secondary)': 2,
  "Bachelor's degree": 4
});

const CANONICAL_EDUCATION_LEVELS = Object.freeze({
  1: 'Lower Than High School',
  2: 'High School Level (including A-Level and IB Certificate)',
  3: 'Certificate / Diploma',
  4: "Bachelor's Degree",
  5: 'Postgraduate'
});

const getGradeEducationLevel = (gradeLevel) =>
  GRADE_TO_EDUCATION_LEVEL[String(gradeLevel || '').trim()] || null;

const getEducationPairError = ({ gradeLevel, educationLevel }) => {
  const gradeRank = getGradeEducationLevel(gradeLevel);
  if (!gradeRank || !educationLevel) return null;
  if (Number(educationLevel.level) === gradeRank) return null;
  return `Education level and current or highest grade must describe the same level. "${gradeLevel}" does not match "${educationLevel.description}".`;
};

module.exports = {
  CANONICAL_EDUCATION_LEVELS,
  GRADE_TO_EDUCATION_LEVEL,
  getGradeEducationLevel,
  getEducationPairError
};

'use strict';

const {
  CANONICAL_EDUCATION_LEVELS,
  getEducationPairError,
  getGradeEducationLevel
} = require('../src/utils/profileEducation');

describe('profile education consistency', () => {
  test('maps canonical and legacy values to stable education levels', () => {
    expect(getGradeEducationLevel('IB Certificate')).toBe(2);
    expect(getGradeEducationLevel("Bachelor's Degree")).toBe(4);
    expect(getGradeEducationLevel('Form 5 / O-Level (Senior Secondary)')).toBe(2);
    expect(getGradeEducationLevel('Matric')).toBeNull();
  });

  test('accepts a consistent pair and rejects a contradictory pair', () => {
    expect(getEducationPairError({
      gradeLevel: 'A-Level',
      educationLevel: { level: 2, description: CANONICAL_EDUCATION_LEVELS[2] }
    })).toBeNull();
    expect(getEducationPairError({
      gradeLevel: "Bachelor's Degree",
      educationLevel: { level: 1, description: CANONICAL_EDUCATION_LEVELS[1] }
    })).toMatch(/does not match/i);
  });
});

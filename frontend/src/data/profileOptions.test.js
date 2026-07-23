import {
  GENDER_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  educationPairError,
  normalizeGradeLevel
} from './profileOptions';

const educationLevels = [
  { id: 'level-1', level: 1, description: 'Lower Than High School' },
  { id: 'level-2', level: 2, description: 'High School Level' },
  { id: 'level-4', level: 4, description: "Bachelor's Degree" }
];

describe('canonical profile options', () => {
  test('contains the approved gender and grade options without Matric', () => {
    expect(GENDER_OPTIONS.map(({ value }) => value)).toEqual([
      'male',
      'female',
      'other',
      'prefer_not_to_say'
    ]);
    expect(GRADE_LEVEL_OPTIONS).toContain('IB Certificate');
    expect(GRADE_LEVEL_OPTIONS).not.toContain('Matric');
  });

  test('maps legacy records without losing their education meaning', () => {
    expect(normalizeGradeLevel('Form 5 / O-Level (Senior Secondary)')).toBe('High School Level');
    expect(normalizeGradeLevel("Bachelor's degree")).toBe("Bachelor's Degree");
  });

  test('accepts matching pairs and rejects contradictory pairs', () => {
    expect(educationPairError({
      educationLevelId: 'level-2',
      gradeLevel: 'IB Certificate',
      educationLevels
    })).toBe('');
    expect(educationPairError({
      educationLevelId: 'level-1',
      gradeLevel: "Bachelor's Degree",
      educationLevels
    })).toMatch(/does not match/i);
  });
});

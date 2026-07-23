import {
  canSelectAnyInstitution,
  getAssignedInstitutionName
} from './administratorScope';

describe('administrator institution scope', () => {
  test('only System Administrators can select any institution', () => {
    expect(canSelectAnyInstitution('System Administrator')).toBe(true);
    expect(canSelectAnyInstitution('Test Administrator')).toBe(false);
    expect(canSelectAnyInstitution('Test Taker')).toBe(false);
  });

  test('uses the assigned institution details already present on the account', () => {
    expect(getAssignedInstitutionName({
      institution: { name: 'Mbabane Central High School' },
      currentInstitution: 'Legacy School'
    })).toBe('Mbabane Central High School');
    expect(getAssignedInstitutionName({ currentInstitution: 'Legacy School' }))
      .toBe('Legacy School');
  });
});

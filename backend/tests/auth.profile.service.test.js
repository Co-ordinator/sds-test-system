'use strict';

const mockUserFindByPk = jest.fn();
const mockEducationFindByPk = jest.fn();
const mockEducationFindOne = jest.fn();

jest.mock('../src/models', () => ({
  User: { findByPk: mockUserFindByPk },
  EducationLevel: {
    findByPk: mockEducationFindByPk,
    findOne: mockEducationFindOne
  },
  Occupation: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Institution: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn()
  },
  Permission: {},
  sequelize: {
    where: jest.fn(),
    fn: jest.fn(),
    col: jest.fn()
  }
}));

jest.mock('../src/utils/generateStudentCode', () => ({
  generateStudentCode: jest.fn()
}));

jest.mock('../src/services/userDeletion.service', () => ({
  permanentlyDeleteUser: jest.fn()
}));

const authService = require('../src/services/auth.service');

const makeCompleteUser = (overrides = {}) => {
  const values = {
    id: 'user-1',
    role: 'Test Taker',
    email: 'learner@example.com',
    isEmailVerified: true,
    createdByTestAdministrator: false,
    firstName: 'Learner',
    lastName: 'Example',
    gender: 'female',
    userType: 'High School Student',
    region: 'hhohho',
    district: 'Mbabane',
    address: 'Mbabane',
    preferredLanguage: 'en',
    gradeLevel: 'High School Level',
    educationLevel: 'level-2',
    currentInstitution: 'Example High School',
    institutionId: 'institution-1',
    onboardingCompleted: true,
    update: jest.fn(),
    ...overrides
  };
  values.get = jest.fn(() => ({ ...values }));
  values.update.mockImplementation(async (updates) => {
    Object.assign(values, updates);
    return values;
  });
  return values;
};

describe('test-taker profile API validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEducationFindByPk.mockResolvedValue({
      id: 'level-2',
      level: 2,
      description: 'High School Level'
    });
  });

  test('rejects a missing mandatory field without persisting partial data', async () => {
    const user = makeCompleteUser();
    mockUserFindByPk.mockResolvedValue(user);

    await expect(authService.updateProfile(user.id, { district: '' }))
      .rejects.toMatchObject({
        code: 'PROFILE_REQUIRED_FIELD_MISSING',
        fields: expect.arrayContaining(['district'])
      });
    expect(user.update).not.toHaveBeenCalled();
  });

  test('rejects a contradictory education-level and grade pair', async () => {
    const user = makeCompleteUser();
    mockUserFindByPk.mockResolvedValue(user);
    mockEducationFindByPk.mockResolvedValue({
      id: 'level-1',
      level: 1,
      description: 'Lower Than High School'
    });

    await expect(authService.updateProfile(user.id, {
      gradeLevel: "Bachelor's Degree",
      educationLevel: 'level-1'
    })).rejects.toMatchObject({ code: 'EDUCATION_LEVEL_CONFLICT' });
    expect(user.update).not.toHaveBeenCalled();
  });

  test('saves a valid canonical profile update and keeps onboarding complete', async () => {
    const user = makeCompleteUser();
    mockUserFindByPk
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);

    const result = await authService.updateProfile(user.id, {
      district: 'Ezulwini',
      address: 'Ezulwini'
    });

    expect(user.update).toHaveBeenCalledWith({
      district: 'Ezulwini',
      address: 'Ezulwini'
    });
    expect(result.updated).toBe(user);
  });
});

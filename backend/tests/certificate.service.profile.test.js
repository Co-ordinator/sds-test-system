'use strict';

jest.mock('../src/models', () => ({
  Certificate: {
    count: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn()
  },
  Assessment: {
    findByPk: jest.fn()
  },
  Answer: {
    findAll: jest.fn()
  },
  User: { modelName: 'User' },
  Institution: { modelName: 'Institution' },
  Occupation: { modelName: 'Occupation' }
}));

jest.mock('../src/services/scoring.service', () => ({
  getAssessmentDisplayCode: jest.fn(),
  getDisplayCodeFromScores: jest.fn(() => 'R I A'),
  parseDisplayCodeGroups: jest.fn(() => [['R'], ['I'], ['A']]),
  getRecommendations: jest.fn(async () => ({ occupations: [] }))
}));

const { Assessment, Answer, Certificate } = require('../src/models');
const certificateService = require('../src/services/certificate.service');

const expectRoleAwareUserInclude = (query) => {
  const userInclude = query.include[0];
  expect(userInclude.as).toBe('user');
  expect(userInclude.attributes).toEqual(expect.arrayContaining([
    'userType',
    'currentInstitution',
    'workplaceName',
    'currentOccupation',
    'district',
    'region'
  ]));
  expect(userInclude.include.map((entry) => entry.as)).toEqual([
    'institution',
    'workplace',
    'occupation'
  ]);
  userInclude.include.forEach((entry) => expect(entry.required).toBe(false));
};

describe('certificate profile data loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Assessment.findByPk.mockResolvedValue({
      id: 'assessment-1',
      userId: 'user-1',
      status: 'completed',
      completedAt: '2026-07-01T10:00:00.000Z',
      hollandCode: 'RIA',
      scoreR: 10,
      scoreI: 9,
      scoreA: 8,
      scoreS: 7,
      scoreE: 6,
      scoreC: 5,
      user: {
        userType: 'Professional',
        workplaceName: 'Example Employer',
        currentOccupation: 'Accountant'
      }
    });
    Certificate.findOne.mockResolvedValue({
      id: 'certificate-1',
      certNumber: 'SDS/2026/0001',
      generatedAt: '2026-07-10T10:00:00.000Z'
    });
    Answer.findAll.mockResolvedValue([]);
  });

  test('loads all role associations when issuing and downloading certificates', async () => {
    await certificateService.generateCertificate('assessment-1', 'admin-1');
    expectRoleAwareUserInclude(Assessment.findByPk.mock.calls[0][1]);

    await certificateService.getDownloadData('assessment-1', 'user-1', 'Test Taker');
    expectRoleAwareUserInclude(Assessment.findByPk.mock.calls[1][1]);
  });
});

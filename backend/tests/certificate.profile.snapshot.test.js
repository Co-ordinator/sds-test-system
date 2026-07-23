jest.mock('../src/models', () => ({
  Answer: { findAll: jest.fn() },
  Assessment: { findByPk: jest.fn() },
  Occupation: {},
  EducationLevel: {},
  AuditLog: { create: jest.fn() },
  User: {},
  Course: {},
  CourseRequirement: {},
  CourseInstitution: {},
  Institution: {},
  Subject: {},
  OccupationCourse: {},
  sequelize: { transaction: jest.fn() }
}));

const { Assessment, Answer, AuditLog, sequelize } = require('../src/models');
const scoringService = require('../src/services/scoring.service');
const { buildCertificateProfileSnapshot } = require('../src/utils/certificateProfileSnapshot');

describe('certificate profile snapshots', () => {
  test('captures the professional certificate context without sensitive identity or address fields', () => {
    const snapshot = buildCertificateProfileSnapshot({
      userType: 'Professional',
      nationalId: 'SHOULD-NOT-BE-CAPTURED',
      address: 'SHOULD-NOT-BE-CAPTURED',
      currentInstitution: 'Legacy School Value',
      institution: { name: 'Legacy Associated School', region: 'lubombo' },
      workplaceName: 'Fallback Employer',
      workplace: { name: 'Example Employer', district: 'Mbabane', region: 'hhohho' },
      currentOccupation: 'Fallback Occupation',
      occupation: { name: 'Accountant' },
      district: 'Fallback District',
      region: 'manzini'
    });

    expect(snapshot).toEqual({
      userType: 'Professional',
      institutionName: null,
      workplaceName: 'Example Employer',
      occupationName: 'Accountant',
      district: 'Mbabane',
      region: 'hhohho'
    });
    expect(snapshot).not.toHaveProperty('nationalId');
    expect(snapshot).not.toHaveProperty('address');
  });

  test('uses student institution location and safe string fallbacks', () => {
    expect(buildCertificateProfileSnapshot({
      userType: 'High School Student',
      currentInstitution: 'Mbabane Central High School',
      district: 'Mbabane',
      region: 'hhohho'
    })).toEqual({
      userType: 'High School Student',
      institutionName: 'Mbabane Central High School',
      workplaceName: null,
      occupationName: null,
      district: 'Mbabane',
      region: 'hhohho'
    });
  });
});

describe('scoringService assessment finalization snapshot', () => {
  let transaction;
  let assessment;
  let recommendationSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    transaction = {
      LOCK: { UPDATE: 'UPDATE' },
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue()
    };
    assessment = {
      id: 'assessment-1',
      userId: 'user-1',
      status: 'in_progress',
      certificateProfileSnapshot: null,
      user: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'Professional',
        email: 'test@example.com',
        userType: 'Professional',
        educationLevel: 'education-level-1',
        workplaceName: 'Example Employer',
        currentOccupation: 'Accountant',
        district: 'Mbabane',
        region: 'hhohho'
      },
      get: jest.fn((key) => assessment[key]),
      update: jest.fn().mockResolvedValue()
    };
    sequelize.transaction.mockResolvedValue(transaction);
    Assessment.findByPk.mockResolvedValue(assessment);
    Answer.findAll.mockResolvedValue([]);
    AuditLog.create.mockResolvedValue();
    recommendationSpy = jest.spyOn(scoringService, 'getRecommendations').mockResolvedValue({
      occupations: [],
      courses: [],
      suggestedSubjects: []
    });
  });

  afterEach(() => {
    recommendationSpy.mockRestore();
  });

  test('captures a snapshot in the same transaction as first completion', async () => {
    await scoringService.finalizeAssessment('assessment-1');

    expect(Assessment.findByPk).toHaveBeenCalledWith(
      'assessment-1',
      expect.objectContaining({
        transaction,
        lock: { level: 'UPDATE', of: Assessment }
      })
    );
    expect(assessment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        certificateProfileSnapshot: {
          userType: 'Professional',
          institutionName: null,
          workplaceName: 'Example Employer',
          occupationName: 'Accountant',
          district: 'Mbabane',
          region: 'hhohho'
        }
      }),
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalledTimes(1);
    expect(transaction.rollback).not.toHaveBeenCalled();
  });

  test('does not replace a snapshot that already exists', async () => {
    assessment.certificateProfileSnapshot = {
      userType: 'Professional',
      institutionName: null,
      workplaceName: 'Original Employer',
      occupationName: 'Original Occupation',
      district: 'Original District',
      region: 'hhohho'
    };

    await scoringService.finalizeAssessment('assessment-1');

    const completionValues = assessment.update.mock.calls[0][0];
    expect(completionValues).not.toHaveProperty('certificateProfileSnapshot');
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test('refuses to finalize an already completed assessment after acquiring the row lock', async () => {
    assessment.status = 'completed';

    await expect(scoringService.finalizeAssessment('assessment-1')).rejects.toMatchObject({
      code: 'ASSESSMENT_NOT_IN_PROGRESS'
    });

    expect(assessment.update).not.toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
  });
});

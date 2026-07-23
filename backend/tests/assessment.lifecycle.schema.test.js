'use strict';

jest.mock('../src/models', () => ({
  Assessment: {
    rawAttributes: {
      id: { field: 'id' },
      status: { field: 'status' },
      progress: { field: 'progress' },
      scoreR: { field: 'score_r' },
      scoreI: { field: 'score_i' },
      scoreA: { field: 'score_a' },
      scoreS: { field: 'score_s' },
      scoreE: { field: 'score_e' },
      scoreC: { field: 'score_c' },
      hollandCode: { field: 'holland_code' },
      educationLevelAtTest: { field: 'education_level_at_test' },
      userId: { field: 'user_id' },
      completedAt: { field: 'completed_at' },
      createdAt: { field: 'created_at' },
      updatedAt: { field: 'updated_at' }
    },
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    sequelize: { transaction: jest.fn() }
  },
  Answer: {
    findAll: jest.fn(),
    bulkCreate: jest.fn(),
    count: jest.fn()
  },
  Question: {
    count: jest.fn(),
    findAll: jest.fn()
  },
  User: {}
}));

jest.mock('../src/services/scoring.service', () => ({
  getAssessmentDisplayCode: jest.fn(() => 'RIA')
}));

const { Assessment } = require('../src/models');
const assessmentService = require('../src/services/assessment.service');
const {
  ASSESSMENT_CORE_ATTRIBUTES,
  getAssessmentDatabaseColumns
} = require('../src/utils/assessmentColumns');

describe('assessment lifecycle schema compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts an assessment using only columns guaranteed by the base assessments schema', async () => {
    const created = { id: 'assessment-1', status: 'in_progress', userId: 'user-1' };
    Assessment.findOne.mockResolvedValue(null);
    Assessment.create.mockResolvedValue(created);

    await expect(assessmentService.startAssessment('user-1')).resolves.toEqual({
      assessment: created,
      resumed: false
    });

    expect(Assessment.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1', status: 'in_progress' },
      attributes: ASSESSMENT_CORE_ATTRIBUTES
    }));
    expect(Assessment.create).toHaveBeenCalledWith(
      { userId: 'user-1', status: 'in_progress', progress: 0 },
      {
        fields: ['userId', 'status', 'progress'],
        returning: getAssessmentDatabaseColumns(Assessment)
      }
    );

    const createOptions = Assessment.create.mock.calls[0][1];
    expect(createOptions.returning).toContain('score_r');
    expect(createOptions.returning).toContain('holland_code');
    expect(createOptions.returning).not.toContain('scoreR');
    expect(createOptions.returning).not.toContain('hollandCode');
  });

  it('resumes the current assessment without attempting to create another one', async () => {
    const existing = { id: 'assessment-1', status: 'in_progress', userId: 'user-1' };
    Assessment.findOne.mockResolvedValue(existing);

    await expect(assessmentService.startAssessment('user-1')).resolves.toEqual({
      assessment: existing,
      resumed: true
    });

    expect(Assessment.create).not.toHaveBeenCalled();
  });
});

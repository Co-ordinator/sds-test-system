jest.mock('../src/models', () => ({
  Assessment: {
    findOne: jest.fn(),
    update: jest.fn(),
    sequelize: { transaction: jest.fn() }
  },
  Answer: {
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
  getAssessmentDisplayCode: jest.fn()
}));

const { Assessment, Answer, Question } = require('../src/models');
const assessmentService = require('../src/services/assessment.service');

describe('assessment progress persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const transaction = { commit: jest.fn(), rollback: jest.fn() };
    Assessment.findOne.mockResolvedValue({ id: 'assessment-1', status: 'in_progress' });
    Assessment.sequelize.transaction.mockResolvedValue(transaction);
    Assessment.update.mockResolvedValue([1]);
    Question.count.mockResolvedValue(228);
    Question.findAll.mockResolvedValue([
      { id: 'question-1', section: 'activities', riasecType: 'R' }
    ]);
    Answer.bulkCreate.mockResolvedValue([]);
    Answer.count.mockResolvedValue(1);
  });

  it('persists a batch with one answer count and returns the committed progress', async () => {
    const result = await assessmentService.saveProgress('assessment-1', 'user-1', [
      { questionId: 'question-1', value: 'yes' }
    ]);

    expect(Answer.bulkCreate).toHaveBeenCalledWith([
      expect.objectContaining({
        assessmentId: 'assessment-1',
        questionId: 'question-1',
        value: 'YES',
        section: 'activities',
        riasecType: 'R'
      })
    ], expect.objectContaining({ updateOnDuplicate: expect.any(Array) }));
    expect(Answer.count).toHaveBeenCalledTimes(1);
    expect(Assessment.update).toHaveBeenCalledWith(
      { progress: 0.44 },
      expect.objectContaining({ where: { id: 'assessment-1' } })
    );
    expect(result).toEqual({ progress: 0.44, answeredCount: 1 });
  });
});

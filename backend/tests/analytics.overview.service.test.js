'use strict';

const mockUserCount = jest.fn();
const mockAssessmentCount = jest.fn();
const mockAssessmentFindOne = jest.fn();

jest.mock('../src/models', () => ({
  User: { count: mockUserCount },
  Assessment: {
    count: mockAssessmentCount,
    findOne: mockAssessmentFindOne,
    sequelize: {
      fn: jest.fn((...args) => ({ fn: args })),
      col: jest.fn((name) => ({ col: name }))
    }
  },
  Institution: {},
  Occupation: {},
  Course: {},
  CourseInstitution: {},
  OccupationCourse: {}
}));

const analyticsService = require('../src/services/analytics.service');

describe('analytics overview engagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('counts unique users with incomplete or completed attempts exactly once', async () => {
    // Fixture semantics:
    // - one user has no attempt;
    // - one user has one incomplete attempt;
    // - one user has one completed plus two other attempts.
    // The assessment total is four, but the engaged-user numerator is two.
    mockUserCount
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);
    mockAssessmentCount
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    mockAssessmentFindOne.mockResolvedValue({});

    const overview = await analyticsService.getOverview();

    expect(overview.totals).toMatchObject({
      users: 3,
      assessments: 4,
      completedAssessments: 1,
      usersWithAssessments: 2
    });
    expect(mockAssessmentCount).toHaveBeenNthCalledWith(3, expect.objectContaining({
      distinct: true,
      col: 'user_id',
      where: {}
    }));
    expect(mockAssessmentCount.mock.calls[2][0].where).not.toHaveProperty('status');
  });
});

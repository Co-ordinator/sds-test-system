'use strict';

const request = require('supertest');
const express = require('express');

const mockUserFindByPk = jest.fn();
const mockListMyAssessments = jest.fn();
const mockGetResults = jest.fn();
const mockSendEmail = jest.fn();

jest.mock('../src/middleware/authentication.middleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'user-1', role: 'Test Taker' };
    next();
  }
}));

jest.mock('../src/models', () => ({
  User: { findByPk: mockUserFindByPk }
}));

jest.mock('../src/services/assessment.service', () => ({
  listMyAssessments: mockListMyAssessments,
  getResults: mockGetResults
}));

jest.mock('../src/config/email.config', () => ({
  sendEmail: mockSendEmail
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const resultsRouter = require('../src/routes/test-results.routes');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/test-results', resultsRouter);
  app.use((error, req, res, next) => {
    res.status(error.statusCode || error.status || 500).json({
      status: 'error',
      code: error.code,
      message: error.message
    });
  });
  return app;
};

describe('result email route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('sends the authenticated user latest completed result and waits for provider acceptance', async () => {
    mockUserFindByPk.mockResolvedValue({
      id: 'user-1',
      email: 'learner@example.com',
      firstName: 'Learner'
    });
    mockListMyAssessments.mockResolvedValue([
      { id: 'assessment-1', status: 'completed' }
    ]);
    mockGetResults.mockResolvedValue({
      assessment: {
        id: 'assessment-1',
        hollandCode: 'SCA',
        hollandCodeDisplay: 'S C A/E',
        scoreR: 2,
        scoreI: 3,
        scoreA: 8,
        scoreS: 10,
        scoreE: 8,
        scoreC: 9,
        completedAt: new Date('2026-07-20T12:00:00.000Z')
      },
      recommendations: {
        occupations: [{
          name: 'Counsellor',
          primaryRiasec: 'S',
          relevanceScore: 276
        }]
      }
    });
    mockSendEmail.mockResolvedValue({ messageId: 'provider-message-1', attempts: 1 });

    const response = await request(makeApp())
      .post('/api/v1/test-results/email')
      .expect(200);

    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      email: 'learner@example.com',
      subject: 'Your SDS Career Assessment Results',
      template: 'test-results',
      context: expect.objectContaining({
        firstName: 'Learner',
        hollandCode: 'S C A/E',
        scores: expect.arrayContaining([
          expect.objectContaining({ letter: 'S', score: 100 })
        ]),
        recommendations: [
          expect.objectContaining({ title: 'Counsellor', matchPercentage: 92 })
        ]
      })
    }));
    expect(response.body.message).toContain('learner@example.com');
  });

  test('surfaces a provider failure instead of returning false success', async () => {
    mockUserFindByPk.mockResolvedValue({
      id: 'user-1',
      email: 'learner@example.com',
      firstName: 'Learner'
    });
    mockListMyAssessments.mockResolvedValue([{ id: 'assessment-1', status: 'completed' }]);
    mockGetResults.mockResolvedValue({
      assessment: { id: 'assessment-1', hollandCode: 'RIA' },
      recommendations: { occupations: [] }
    });
    mockSendEmail.mockRejectedValue(new Error('SMTP unavailable'));

    const response = await request(makeApp())
      .post('/api/v1/test-results/email')
      .expect(500);

    expect(response.body.status).toBe('error');
  });

  test('rejects the request when no completed assessment exists', async () => {
    mockUserFindByPk.mockResolvedValue({
      id: 'user-1',
      email: 'learner@example.com'
    });
    mockListMyAssessments.mockResolvedValue([{ id: 'assessment-1', status: 'in_progress' }]);

    const response = await request(makeApp())
      .post('/api/v1/test-results/email')
      .expect(404);

    expect(response.body.code).toBe('NO_COMPLETED_ASSESSMENT');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

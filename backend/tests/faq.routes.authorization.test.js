'use strict';

const request = require('supertest');
const express = require('express');

const mockCreateFaq = jest.fn();
const mockListPublished = jest.fn();

jest.mock('../src/middleware/authentication.middleware', () => {
  const actual = jest.requireActual('../src/middleware/authentication.middleware');
  return {
    ...actual,
    verifyToken: (req, res, next) => {
      req.user = {
        id: 'actor-1',
        role: req.headers['x-test-role'] || 'Test Taker'
      };
      next();
    }
  };
});

jest.mock('../src/services/faq.service', () => ({
  listPublished: mockListPublished,
  listAll: jest.fn().mockResolvedValue([]),
  createFaq: mockCreateFaq,
  updateFaq: jest.fn(),
  deleteFaq: jest.fn()
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const faqRouter = require('../src/routes/faq.routes');

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/faqs', faqRouter);
  app.use((error, req, res, next) => {
    res.status(error.statusCode || error.status || 500).json({
      status: 'error',
      code: error.code,
      message: error.message
    });
  });
  return app;
};

describe('FAQ route authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListPublished.mockResolvedValue([]);
    mockCreateFaq.mockResolvedValue({
      id: 'faq-1',
      question: 'Question',
      answer: 'Answer',
      status: 'draft'
    });
  });

  test('published FAQs remain publicly readable', async () => {
    await request(makeApp()).get('/api/v1/faqs').expect(200);
    expect(mockListPublished).toHaveBeenCalledTimes(1);
  });

  test('a non-system administrator cannot create FAQs', async () => {
    await request(makeApp())
      .post('/api/v1/faqs')
      .set('x-test-role', 'Test Administrator')
      .send({ question: 'Question', answer: 'Answer' })
      .expect(403);
    expect(mockCreateFaq).not.toHaveBeenCalled();
  });

  test('a system administrator can create an FAQ', async () => {
    await request(makeApp())
      .post('/api/v1/faqs')
      .set('x-test-role', 'System Administrator')
      .send({ question: 'Question', answer: 'Answer' })
      .expect(201);
    expect(mockCreateFaq).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'Question', answer: 'Answer' }),
      'actor-1'
    );
  });
});

'use strict';

const mockFindAll = jest.fn();
const mockFindByPk = jest.fn();
const mockCreate = jest.fn();

jest.mock('../src/models', () => ({
  Faq: {
    findAll: mockFindAll,
    findByPk: mockFindByPk,
    create: mockCreate
  }
}));

const faqService = require('../src/services/faq.service');

describe('FAQ service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates normalized plain-text FAQ content', async () => {
    mockCreate.mockImplementation(async (value) => value);

    const faq = await faqService.createFaq({
      question: '  How do I start?  ',
      answer: '  Open the dashboard.  ',
      category: ' Getting started ',
      status: 'published',
      sortOrder: '2'
    }, 'admin-id');

    expect(faq).toMatchObject({
      question: 'How do I start?',
      answer: 'Open the dashboard.',
      category: 'Getting started',
      status: 'published',
      sortOrder: 2,
      createdBy: 'admin-id'
    });
  });

  test('rejects unsupported status and overlong content', async () => {
    await expect(faqService.createFaq({
      question: 'Question',
      answer: 'Answer',
      status: 'archived'
    }, 'admin-id')).rejects.toMatchObject({ code: 'FAQ_STATUS_INVALID' });

    await expect(faqService.createFaq({
      question: 'Q'.repeat(501),
      answer: 'Answer'
    }, 'admin-id')).rejects.toMatchObject({ code: 'FAQ_QUESTION_TOO_LONG' });
  });

  test('lists only published FAQs for public display', async () => {
    mockFindAll.mockResolvedValue([]);
    await faqService.listPublished();
    expect(mockFindAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'published' }
    }));
  });
});

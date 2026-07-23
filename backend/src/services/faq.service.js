'use strict';

const { Faq } = require('../models');
const { AppError, NotFoundError, BadRequestError } = require('../utils/errors/appError');

const isMissingFaqTable = (error) =>
  error?.original?.code === '42P01' || error?.parent?.code === '42P01';

const faqStorageNotReady = () => new AppError(
  'FAQ management will be available after the FAQ database migration is applied.',
  { status: 503, code: 'FAQ_STORAGE_NOT_READY', expose: true }
);

const normalizePlainText = (value, { label, maxLength, required = false }) => {
  const normalized = String(value ?? '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .trim();
  if (required && !normalized) {
    throw new BadRequestError(`${label} is required`, `FAQ_${label.toUpperCase()}_REQUIRED`);
  }
  if (normalized.length > maxLength) {
    throw new BadRequestError(
      `${label} must be ${maxLength} characters or fewer`,
      `FAQ_${label.toUpperCase()}_TOO_LONG`
    );
  }
  return normalized;
};

const normalizeCategory = (category) => {
  const value = normalizePlainText(category, { label: 'category', maxLength: 64 });
  return value || null;
};

const normalizeStatus = (status, fallback = 'draft') => {
  const value = status ?? fallback;
  if (!['draft', 'published'].includes(value)) {
    throw new BadRequestError('FAQ status must be draft or published', 'FAQ_STATUS_INVALID');
  }
  return value;
};

const normalizeSortOrder = (sortOrder, fallback = 0) => {
  const value = sortOrder ?? fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100000) {
    throw new BadRequestError('FAQ sort order must be a whole number from 0 to 100000', 'FAQ_SORT_ORDER_INVALID');
  }
  return parsed;
};

module.exports = {
  listPublished: async () => {
    try {
      return await Faq.findAll({
        where: { status: 'published' },
        attributes: ['id', 'question', 'answer', 'category', 'sortOrder'],
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
      });
    } catch (error) {
      if (isMissingFaqTable(error)) return [];
      throw error;
    }
  },

  listAll: async () => {
    try {
      return await Faq.findAll({
        order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']]
      });
    } catch (error) {
      if (isMissingFaqTable(error)) return [];
      throw error;
    }
  },

  createFaq: async ({ question, answer, category, status, sortOrder }, userId) => {
    try {
      return await Faq.create({
        question: normalizePlainText(question, { label: 'question', maxLength: 500, required: true }),
        answer: normalizePlainText(answer, { label: 'answer', maxLength: 5000, required: true }),
        category: normalizeCategory(category),
        status: normalizeStatus(status),
        sortOrder: normalizeSortOrder(sortOrder),
        createdBy: userId || null
      });
    } catch (error) {
      if (isMissingFaqTable(error)) throw faqStorageNotReady();
      throw error;
    }
  },

  updateFaq: async (id, { question, answer, category, status, sortOrder }) => {
    let faq;
    try {
      faq = await Faq.findByPk(id);
    } catch (error) {
      if (isMissingFaqTable(error)) throw faqStorageNotReady();
      throw error;
    }
    if (!faq) throw new NotFoundError('FAQ not found', 'FAQ_NOT_FOUND');
    const updates = {};
    if (question !== undefined) {
      updates.question = normalizePlainText(question, { label: 'question', maxLength: 500, required: true });
    }
    if (answer !== undefined) {
      updates.answer = normalizePlainText(answer, { label: 'answer', maxLength: 5000, required: true });
    }
    if (category !== undefined) updates.category = normalizeCategory(category);
    if (status !== undefined) updates.status = normalizeStatus(status);
    if (sortOrder !== undefined) updates.sortOrder = normalizeSortOrder(sortOrder);
    await faq.update(updates);
    return faq;
  },

  deleteFaq: async (id) => {
    let faq;
    try {
      faq = await Faq.findByPk(id);
    } catch (error) {
      if (isMissingFaqTable(error)) throw faqStorageNotReady();
      throw error;
    }
    if (!faq) throw new NotFoundError('FAQ not found', 'FAQ_NOT_FOUND');
    await faq.destroy();
    return faq;
  }
};

'use strict';

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Question, sequelize } = require('../models');
const { Op } = require('sequelize');
const { questionsArraySchema } = require('../validations/question.validation');

const parseCsvQuestions = async (csvText) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({ columns: true, bom: true, trim: true, skip_empty_lines: true });
    parser.on('readable', () => { let record; while ((record = parser.read())) records.push(record); });
    parser.on('error', (err) => reject(err));
    parser.on('end', () => resolve(records));
    Readable.from(csvText).pipe(parser);
  });
};

const normalizeCsvRecords = (records) => {
  return records.map((row, idx) => ({
    _row: idx + 2,
    text: row.text,
    section: row.section,
    riasecType: row.riasec_type || row.riasectype || row.riasecType || row.riasectype,
    order: row.order !== undefined ? Number(row.order) : undefined,
    id: row.id ? Number(row.id) : undefined
  }));
};

const validateQuestionsArray = (questions) => {
  const { value, error } = questionsArraySchema.validate(questions, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
    const err = new Error(`Validation failed: ${errors.join('; ')}`);
    err.statusCode = 400;
    throw err;
  }
  return value;
};

const detectDuplicatePairs = (questions) => {
  const seen = new Map();
  const duplicates = [];
  questions.forEach((q, idx) => {
    const key = `${q.section}|${q.order}`;
    if (seen.has(key)) {
      duplicates.push({ firstIndex: seen.get(key), duplicateIndex: idx, section: q.section, order: q.order });
    } else {
      seen.set(key, idx);
    }
  });
  return duplicates;
};

module.exports = {

  listQuestions: async ({ section, riasecType } = {}) => {
    const where = {};
    if (section) where.section = section;
    if (riasecType) where.riasecType = riasecType;
    return await Question.findAll({
      where,
      order: [['section', 'ASC'], ['order', 'ASC']]
    });
  },

  createQuestion: async (data) => {
    return await Question.create(data);
  },

  updateQuestion: async (id, data) => {
    const question = await Question.findByPk(id);
    if (!question) throw new Error('Question not found');
    await question.update(data);
    return question;
  },

  deleteQuestion: async (id) => {
    const question = await Question.findByPk(id);
    if (!question) throw new Error('Question not found');
    await question.destroy();
    return question;
  },

  bulkDeleteQuestions: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new Error('ids array required');
    return await Question.destroy({ where: { id: { [Op.in]: ids } } });
  },

  importQuestions: async (payload, contentType, dryRun = false) => {
    const transaction = await sequelize.transaction();
    try {
      let questionsInput;

      if (contentType === 'text/csv') {
        const records = await parseCsvQuestions(payload || '');
        const normalized = normalizeCsvRecords(records);
        const missingHeaders = ['text', 'section', 'order'].filter((h) => records.length && !(h in records[0]));
        if (missingHeaders.length) {
          const err = new Error(`CSV missing required headers: ${missingHeaders.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }
        questionsInput = normalized;
      } else if (Array.isArray(payload)) {
        questionsInput = payload;
      } else if (payload && Array.isArray(payload.questions)) {
        questionsInput = payload.questions;
      } else {
        const err = new Error('Invalid import payload. Provide an array or { questions: [...] }');
        err.statusCode = 400;
        throw err;
      }

      const validatedQuestions = validateQuestionsArray(questionsInput);
      const duplicates = detectDuplicatePairs(validatedQuestions);
      if (duplicates.length) {
        const err = new Error('Duplicate section+order combinations found in payload');
        err.statusCode = 400;
        err.details = duplicates;
        throw err;
      }

      const sections = [...new Set(validatedQuestions.map((q) => q.section))];
      const orders = [...new Set(validatedQuestions.map((q) => q.order))];
      const existing = await Question.findAll({
        where: { section: sections, order: orders },
        transaction
      });

      const existingMap = new Map();
      existing.forEach((q) => {
        existingMap.set(`${q.section}|${q.order}`, q);
      });

      const summary = { imported: 0, updated: 0, dryRun, total: validatedQuestions.length };

      if (dryRun) {
        await transaction.rollback();
        return summary;
      }

      for (const q of validatedQuestions) {
        const key = `${q.section}|${q.order}`;
        const existingRecord = existingMap.get(key);
        if (existingRecord) {
          await existingRecord.update({
            text: q.text,
            riasecType: q.riasecType,
            section: q.section,
            order: q.order
          }, { transaction });
          summary.updated += 1;
        } else {
          await Question.create(q, { transaction });
          summary.imported += 1;
        }
      }

      await transaction.commit();
      return summary;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  exportQuestions: async (format = 'json') => {
    const questions = await Question.findAll({
      order: [['section', 'ASC'], ['order', 'ASC']]
    });

    if (format === 'csv') {
      const parser = new Parser({ fields: ['id', 'text', 'section', 'riasecType', 'order'] });
      return { csv: parser.parse(questions.map(q => q.toJSON())), questions };
    }

    return { questions };
  }
};

const { Parser } = require('json2csv');
const { parse } = require('csv-parse');
const { Readable } = require('stream');
const { Question, sequelize } = require('../models');
const logger = require('../utils/logger');
const { questionsArraySchema } = require('../validations/question.validation');

const formatQuestionsResponse = (questions) => questions.map((q) => q.toJSON());

const parseCsvQuestions = async (csvText) => {
  return new Promise((resolve, reject) => {
    const records = [];
    const parser = parse({
      columns: true,
      bom: true,
      trim: true,
      skip_empty_lines: true
    });

    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) {
        records.push(record);
      }
    });

    parser.on('error', (err) => {
      reject(err);
    });

    parser.on('end', () => {
      resolve(records);
    });

    Readable.from(csvText).pipe(parser);
  });
};

const normalizeCsvRecords = (records) => {
  return records.map((row, idx) => ({
    _row: idx + 2, // account for header line
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
  // List questions with optional filters
  async listQuestions(req, res, next) {
    try {
      const { section, riasecType } = req.query;
      const where = {};
      if (section) where.section = section;
      if (riasecType) where.riasecType = riasecType;

      const questions = await Question.findAll({
        where,
        order: [
          ['section', 'ASC'],
          ['order', 'ASC']
        ]
      });

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Listed questions',
        req,
        details: {
          adminId: req.user?.id,
          filters: { section, riasecType },
          count: questions.length
        }
      });

      return res.status(200).json({
        status: 'success',
        results: questions.length,
        data: { questions: formatQuestionsResponse(questions) }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to list questions',
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  },

  // Create a question
  async createQuestion(req, res, next) {
    try {
      const question = await Question.create(req.body);

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Question created',
        req,
        details: { adminId: req.user?.id, questionId: question.id }
      });

      return res.status(201).json({
        status: 'success',
        data: { question: question.toJSON() }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to create question',
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  },

  // Update a question
  async updateQuestion(req, res, next) {
    try {
      const question = await Question.findByPk(req.params.id);
      if (!question) {
        logger.warn({
          actionType: 'ADMIN_ACTION',
          message: `Question not found: ${req.params.id}`,
          req,
          details: { adminId: req.user?.id }
        });
        return res.status(404).json({ status: 'error', message: 'Question not found' });
      }

      await question.update(req.body);

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Question updated',
        req,
        details: { adminId: req.user?.id, questionId: question.id }
      });

      return res.status(200).json({
        status: 'success',
        data: { question: question.toJSON() }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: `Failed to update question ${req.params.id}`,
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  },

  // Delete a question
  async deleteQuestion(req, res, next) {
    try {
      const question = await Question.findByPk(req.params.id);
      if (!question) {
        logger.warn({
          actionType: 'ADMIN_ACTION',
          message: `Question not found for deletion: ${req.params.id}`,
          req,
          details: { adminId: req.user?.id }
        });
        return res.status(404).json({ status: 'error', message: 'Question not found' });
      }

      await question.destroy();

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Question deleted',
        req,
        details: { adminId: req.user?.id, questionId: question.id }
      });

      return res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: `Failed to delete question ${req.params.id}`,
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  },

  // Import questions (JSON or CSV) with dry-run and upsert by (section, order)
  async importQuestions(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const dryRun = String(req.query.dryRun || req.query.dry_run || 'false').toLowerCase() === 'true';
      let questionsInput;

      if (req.is('text/csv')) {
        const records = await parseCsvQuestions(req.body || '');
        const normalized = normalizeCsvRecords(records);
        const missingHeaders = ['text', 'section', 'order'].filter((h) => records.length && !(h in records[0]));
        if (missingHeaders.length) {
          const err = new Error(`CSV missing required headers: ${missingHeaders.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }
        questionsInput = normalized;
      } else if (Array.isArray(req.body)) {
        questionsInput = req.body;
      } else if (req.body && Array.isArray(req.body.questions)) {
        questionsInput = req.body.questions;
      } else {
        const err = new Error('Invalid import payload. Provide an array or { questions: [...] }');
        err.statusCode = 400;
        throw err;
      }

      const validatedQuestions = validateQuestionsArray(questionsInput);

      // Detect duplicates within payload on (section, order)
      const duplicates = detectDuplicatePairs(validatedQuestions);
      if (duplicates.length) {
        const err = new Error('Duplicate section+order combinations found in payload');
        err.statusCode = 400;
        err.details = duplicates;
        throw err;
      }

      // Find existing records for upsert by section/order
      const sections = [...new Set(validatedQuestions.map((q) => q.section))];
      const orders = [...new Set(validatedQuestions.map((q) => q.order))];
      const existing = await Question.findAll({
        where: {
          section: sections,
          order: orders
        },
        transaction
      });

      const existingMap = new Map();
      existing.forEach((q) => {
        existingMap.set(`${q.section}|${q.order}`, q);
      });

      const summary = {
        imported: 0,
        updated: 0,
        dryRun,
        total: validatedQuestions.length
      };

      if (dryRun) {
        await transaction.rollback();
        return res.status(200).json({ status: 'success', data: summary });
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

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Questions imported',
        req,
        details: { adminId: req.user?.id, imported: summary.imported, updated: summary.updated, total: summary.total }
      });

      return res.status(201).json({
        status: 'success',
        data: summary
      });
    } catch (error) {
      await transaction.rollback();
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to import questions',
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  },

  // Export questions as JSON or CSV
  async exportQuestions(req, res, next) {
    try {
      const format = (req.query.format || 'json').toLowerCase();
      const questions = await Question.findAll({
        order: [
          ['section', 'ASC'],
          ['order', 'ASC']
        ]
      });

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Questions exported',
        req,
        details: { adminId: req.user?.id, format, count: questions.length }
      });

      if (format === 'csv') {
        const parser = new Parser({ fields: ['id', 'text', 'section', 'riasecType', 'order'] });
        const csv = parser.parse(formatQuestionsResponse(questions));
        res.header('Content-Type', 'text/csv');
        res.attachment('questions.csv');
        return res.status(200).send(csv);
      }

      return res.status(200).json({
        status: 'success',
        results: questions.length,
        data: { questions: formatQuestionsResponse(questions) }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to export questions',
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  }
};

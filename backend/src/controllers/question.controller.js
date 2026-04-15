const questionService = require('../services/question.service');
const logger = require('../utils/logger');

const formatQuestionsResponse = (questions) => questions.map((q) => q.toJSON());

module.exports = {
  async listQuestions(req, res, next) {
    try {
      const questions = await questionService.listQuestions(req.query);
      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Listed questions',
        req,
        details: { adminId: req.user?.id, filters: req.query, count: questions.length }
      });
      return res.status(200).json({
        status: 'success',
        results: questions.length,
        data: { questions: formatQuestionsResponse(questions) }
      });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to list questions', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async createQuestion(req, res, next) {
    try {
      const question = await questionService.createQuestion(req.body);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Question created', req, details: { adminId: req.user?.id, questionId: question.id } });
      return res.status(201).json({ status: 'success', data: { question: question.toJSON() } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to create question', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async updateQuestion(req, res, next) {
    try {
      const question = await questionService.updateQuestion(req.params.id, req.body);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Question updated', req, details: { adminId: req.user?.id, questionId: question.id } });
      return res.status(200).json({ status: 'success', data: { question: question.toJSON() } });
    } catch (error) {
      if (error.code === 'QUESTION_NOT_FOUND') {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `Question not found: ${req.params.id}`, req, details: { adminId: req.user?.id } });
      }
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to update question ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async bulkDeleteQuestions(req, res, next) {
    try {
      const deleted = await questionService.bulkDeleteQuestions(req.body.ids);
      logger.info({ actionType: 'BULK_DELETE_QUESTIONS', message: `Bulk deleted ${deleted} questions`, req, details: { adminId: req.user?.id, count: deleted } });
      return res.json({ status: 'success', data: { deleted } });
    } catch (error) {
      logger.error({ actionType: 'BULK_DELETE_QUESTIONS_FAILED', message: 'Bulk delete questions failed', req, details: { error: error.message } });
      return next(error);
    }
  },

  async deleteQuestion(req, res, next) {
    try {
      const question = await questionService.deleteQuestion(req.params.id);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Question deleted', req, details: { adminId: req.user?.id, questionId: question.id } });
      return res.status(204).send();
    } catch (error) {
      if (error.code === 'QUESTION_NOT_FOUND') {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `Question not found for deletion: ${req.params.id}`, req, details: { adminId: req.user?.id } });
      }
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to delete question ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async importQuestions(req, res, next) {
    try {
      const dryRun = String(req.query.dryRun || req.query.dry_run || 'false').toLowerCase() === 'true';
      const summary = await questionService.importQuestions(req.body, req.is('text/csv') ? 'text/csv' : 'json', dryRun);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Questions imported', req, details: { adminId: req.user?.id, imported: summary.imported, updated: summary.updated, total: summary.total } });
      return res.status(dryRun ? 200 : 201).json({ status: 'success', data: summary });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to import questions', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  },

  async exportQuestions(req, res, next) {
    try {
      const format = (req.query.format || 'json').toLowerCase();
      const result = await questionService.exportQuestions(format);
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Questions exported', req, details: { adminId: req.user?.id, format, count: result.questions.length } });

      if (format === 'csv') {
        res.header('Content-Type', 'text/csv');
        res.attachment('questions.csv');
        return res.status(200).send(result.csv);
      }

      return res.status(200).json({ status: 'success', results: result.questions.length, data: { questions: formatQuestionsResponse(result.questions) } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export questions', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }
};

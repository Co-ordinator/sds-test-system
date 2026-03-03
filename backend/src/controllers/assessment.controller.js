const scoringService = require('../services/scoring.service');
const { Assessment, Answer, Question } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Assessment Controller
 * Coordinates starting assessments, progress saving, and final Holland Code calculation.
 */
class AssessmentController {
  /**
   * Start a new assessment for the current user.
   * Optionally reuses an in-progress assessment if one exists.
   */
  async startAssessment(req, res, next) {
    try {
      const userId = req.user.id;

      const existing = await Assessment.findOne({
        where: { userId, status: 'in_progress' },
        order: [['createdAt', 'DESC']]
      });

      if (existing) {
        return res.status(200).json({
          status: 'success',
          data: { assessment: existing, resumed: true }
        });
      }

      const assessment = await Assessment.create({
        userId,
        status: 'in_progress',
        progress: 0
      });

      logger.info({
        actionType: 'TEST_START',
        message: `Assessment started for user ${userId}`,
        req,
        details: { assessmentId: assessment.id, userId }
      });

      return res.status(201).json({
        status: 'success',
        data: { assessment, resumed: false }
      });
    } catch (error) {
      logger.error({
        actionType: 'ASSESSMENT_START_FAILED',
        message: 'Failed to start assessment',
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  }

  /**
   * List assessments for the current user (for dashboard).
   */
  async listMyAssessments(req, res, next) {
    try {
      const userId = req.user.id;
      const assessments = await Assessment.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'status', 'progress', 'hollandCode', 'completedAt', 'createdAt', 'updatedAt']
      });
      return res.status(200).json({
        status: 'success',
        data: { assessments }
      });
    } catch (error) {
      logger.error({
        actionType: 'ASSESSMENT_LIST_FAILED',
        message: 'Failed to list assessments',
        req,
        details: { error: error.message }
      });
      return next(error);
    }
  }

  /**
   * Get one assessment (for resume or detail). Ensures ownership.
   */
  async getAssessment(req, res, next) {
    try {
      const { assessmentId } = req.params;
      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId: req.user.id }
      });
      if (!assessment) {
        return res.status(404).json({ status: 'error', message: 'Assessment not found' });
      }
      return res.status(200).json({ status: 'success', data: { assessment } });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get questions for the test (by section). Used by the test-taking UI.
   */
  async getQuestions(req, res, next) {
    try {
      const { section } = req.query;
      const where = section ? { section } : {};
      const questions = await Question.findAll({
        where,
        order: [['section'], ['order']],
        attributes: ['id', 'text', 'section', 'riasecType', 'order']
      });
      return res.status(200).json({
        status: 'success',
        data: { questions }
      });
    } catch (error) {
      logger.error({
        actionType: 'QUESTIONS_FETCH_FAILED',
        message: 'Failed to fetch questions',
        req,
        details: { error: error.message }
      });
      return next(error);
    }
  }

  /**
   * Saves a single answer or a batch of answers as the user progresses.
   * Updates the progress percentage for the Student Dashboard.
   */
  async saveProgress(req, res, next) {
    try {
      const assessmentId = req.params.assessmentId;
      const { answers } = req.body; // answers: [{questionId, value, section, riasecType}]

      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId: req.user.id }
      });
      if (!assessment || assessment.status !== 'in_progress') {
        return res.status(404).json({ status: 'error', message: 'Assessment not found or not in progress' });
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ status: 'error', message: 'answers array is required' });
      }

      const totalQuestions = await Question.count();

      const normalizeValue = (v, section) => {
        const s = String(v).trim();
        if (section === 'self_estimates') {
          const n = parseInt(s, 10);
          if (n >= 1 && n <= 6) return String(n);
          return s;
        }
        if (['yes', 'no'].includes(s.toLowerCase())) return s.toUpperCase();
        return s;
      };

      for (const ans of answers) {
        const value = normalizeValue(ans.value, ans.section);
        await Answer.upsert({
          assessmentId,
          questionId: ans.questionId,
          value,
          section: ans.section,
          riasecType: ans.riasecType
        });
      }

      // 2. Calculate and update progress percentage
      const answeredCount = await Answer.count({ where: { assessmentId } });
      const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

      await Assessment.update(
        { progress: progress.toFixed(2) },
        { where: { id: assessmentId } }
      );

      logger.info({
        actionType: 'ASSESSMENT_PROGRESS_SAVED',
        message: `Progress saved for assessment ${assessmentId}`,
        req,
        details: { assessmentId, answeredCount, progress }
      });

      return res.status(200).json({ 
        status: 'success',
        data: { progress: Number(progress.toFixed(2)) }
      });
    } catch (error) {
      logger.error({
        actionType: 'ASSESSMENT_PROGRESS_FAILED',
        message: 'Failed to save progress',
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  }

  /**
   * Final submission: Calculates scores and generates Holland Code.
   */
  async submitAssessment(req, res, next) {
    try {
      const assessmentId = req.params.assessmentId;

      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId: req.user.id }
      });
      if (!assessment || assessment.status !== 'in_progress') {
        return res.status(404).json({ status: 'error', message: 'Assessment not found or not in progress' });
      }

      const answeredCount = await Answer.count({ where: { assessmentId } });
      if (answeredCount < 228) {
        return res.status(400).json({ 
          status: 'error',
          message: 'Assessment is incomplete', 
          answered: answeredCount 
        });
      }

      // Trigger the Scoring Service
      const results = await scoringService.finalizeAssessment(assessmentId);

      logger.info({
        actionType: 'ASSESSMENT_COMPLETED',
        message: `Assessment ${assessmentId} finalized`,
        req,
        details: { assessmentId, hollandCode: results.hollandCode }
      });

      return res.status(200).json({
        status: 'success',
        data: {
          hollandCode: results.hollandCode,
          scores: results.scores,
          recommendations: results.recommendations
        }
      });
    } catch (error) {
      logger.error({
        actionType: 'ASSESSMENT_COMPLETE_FAILED',
        message: `Failed to finalize assessment ${req.params.assessmentId}`,
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  }

  /**
   * Retrieves results for the Dashboard "View Results" action.
   */
  async getResults(req, res, next) {
    try {
      const assessmentId = req.params.assessmentId;
      const assessment = await Assessment.findByPk(assessmentId);

      if (!assessment || assessment.status !== 'completed') {
        return res.status(404).json({ status: 'error', message: 'Results not found' });
      }

      const isOwner = assessment.userId === req.user.id;
      const isStaff = ['admin', 'counselor'].includes(req.user.role);
      if (!isOwner && !isStaff) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to view these results' });
      }

      const recommendations = await scoringService.getRecommendations(
        assessment.hollandCode,
        assessment.educationLevelAtTest
      );

      logger.info({
        actionType: 'ASSESSMENT_RESULTS_FETCHED',
        message: `Results fetched for assessment ${assessmentId}`,
        req,
        details: { assessmentId }
      });

      return res.status(200).json({
        status: 'success',
        data: {
          assessment,
          recommendations
        }
      });
    } catch (error) {
      logger.error({
        actionType: 'ASSESSMENT_RESULTS_FAILED',
        message: `Failed to fetch results for assessment ${req.params.assessmentId}`,
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  }
}

module.exports = new AssessmentController();
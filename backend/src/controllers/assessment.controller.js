const scoringService = require('../services/scoring.service');
const { Assessment, Answer, Question } = require('../models');
const logger = require('../utils/logger');

/**
 * Assessment Controller
 * Coordinates progress saving and final Holland Code calculation.
 */
class AssessmentController {
  /**
   * Saves a single answer or a batch of answers as the user progresses.
   * Updates the progress percentage for the Student Dashboard.
   */
  async saveProgress(req, res, next) {
    try {
      const { assessmentId, answers } = req.body; // answers: [{questionId, value, section, riasecType}]
      const totalQuestions = await Question.count(); // dynamically count questions

      // 1. Bulk upsert answers
      for (const ans of answers) {
        await Answer.upsert({
          assessmentId,
          questionId: ans.questionId,
          value: ans.value,
          section: ans.section,
          riasecType: ans.riasecType
        });
      }

      // 2. Calculate and update progress percentage
      const answeredCount = await Answer.count({ where: { assessmentId } });
      const progress = (answeredCount / totalQuestions) * 100;

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
      const { assessmentId } = req.params;

      // Ensure the test is actually finished (or has enough data)
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
      const { assessmentId } = req.params;
      const assessment = await Assessment.findByPk(assessmentId);

      if (!assessment || assessment.status !== 'completed') {
        return res.status(404).json({ status: 'error', message: 'Results not found' });
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
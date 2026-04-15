'use strict';

const { Assessment, Answer, Question, User } = require('../models');
const { Op } = require('sequelize');
const scoringService = require('./scoring.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors/appError');

module.exports = {

  /* ─── Assessment Lifecycle ────────────────────────────────────────────── */

  startAssessment: async (userId) => {
    const existing = await Assessment.findOne({
      where: { userId, status: 'in_progress' },
      order: [['createdAt', 'DESC']]
    });

    if (existing) {
      return { assessment: existing, resumed: true };
    }

    const assessment = await Assessment.create({
      userId,
      status: 'in_progress',
      progress: 0
    });

    return { assessment, resumed: false };
  },

  listMyAssessments: async (userId) => {
    return await Assessment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'status', 'progress', 'hollandCode', 'completedAt', 'createdAt', 'updatedAt']
    });
  },

  getAssessment: async (assessmentId, userId) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId }
    });
    if (!assessment) throw new NotFoundError('Assessment not found', 'ASSESSMENT_NOT_FOUND');
    return assessment;
  },

  /* ─── Progress Management ─────────────────────────────────────────────── */

  getProgress: async (assessmentId, userId) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId }
    });
    if (!assessment) throw new NotFoundError('Assessment not found', 'ASSESSMENT_NOT_FOUND');

    const saved = await Answer.findAll({
      where: { assessmentId },
      attributes: ['questionId', 'value']
    });

    const answers = {};
    saved.forEach((a) => { answers[a.questionId] = a.value; });
    return answers;
  },

  saveProgress: async (assessmentId, userId, answers) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId }
    });
    if (!assessment || assessment.status !== 'in_progress') {
      throw new NotFoundError('Assessment not found or not in progress', 'ASSESSMENT_NOT_IN_PROGRESS');
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new BadRequestError('answers array is required', 'INVALID_ANSWERS_PAYLOAD');
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
    const questionIds = [...new Set(
      answers.map((ans) => ans?.questionId).filter(Boolean)
    )];
    const questions = await Question.findAll({
      where: { id: questionIds },
      attributes: ['id', 'section', 'riasecType']
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const validRows = [];
    for (const ans of answers) {
      const question = questionMap.get(ans.questionId);
      if (!question) continue;
      const value = normalizeValue(ans.value, question.section);
      validRows.push({
        assessmentId,
        questionId: question.id,
        value,
        section: question.section,
        riasecType: question.riasecType
      });
    }

    const transaction = await Assessment.sequelize.transaction();
    try {
      if (validRows.length > 0) {
        await Answer.bulkCreate(validRows, {
          updateOnDuplicate: ['value', 'section', 'riasec_type', 'updated_at'],
          transaction
        });
      }

      const answeredCount = await Answer.count({ where: { assessmentId }, transaction });
      const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

      await Assessment.update(
        { progress: Number(progress.toFixed(2)) },
        { where: { id: assessmentId }, transaction }
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const answeredCount = await Answer.count({ where: { assessmentId } });
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
    return { progress: Number(progress.toFixed(2)), answeredCount };
  },

  /* ─── Questions ───────────────────────────────────────────────────────── */

  getQuestions: async (section) => {
    const where = section ? { section } : {};
    return await Question.findAll({
      where,
      order: [['section'], ['order']],
      attributes: ['id', 'text', 'section', 'riasecType', 'order', 'questionCode']
    });
  },

  /* ─── Submission & Results ────────────────────────────────────────────── */

  submitAssessment: async (assessmentId, userId) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId }
    });
    if (!assessment || assessment.status !== 'in_progress') {
      throw new NotFoundError('Assessment not found or not in progress', 'ASSESSMENT_NOT_IN_PROGRESS');
    }

    const answeredCount = await Answer.count({ where: { assessmentId } });
    const totalQuestions = await Question.count();
    if (answeredCount < totalQuestions) {
      throw new BadRequestError('Assessment is incomplete', 'ASSESSMENT_INCOMPLETE');
    }

    const results = await scoringService.finalizeAssessment(assessmentId);
    return results;
  },

  getResults: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId);

    if (!assessment || assessment.status !== 'completed') {
      throw new NotFoundError('Results not found', 'RESULTS_NOT_FOUND');
    }

    const isOwner = assessment.userId === userId;
    const isStaff = ['System Administrator', 'Test Administrator'].includes(userRole);
    if (!isOwner && !isStaff) {
      throw new ForbiddenError('Not authorized to view these results', 'RESULTS_NOT_AUTHORIZED');
    }

    const { displayCode } = scoringService.buildHollandCodes({
      R: assessment.scoreR,
      I: assessment.scoreI,
      A: assessment.scoreA,
      S: assessment.scoreS,
      E: assessment.scoreE,
      C: assessment.scoreC,
    }, 0);
    assessment.setDataValue('hollandCodeDisplay', displayCode);

    const recommendations = await scoringService.getRecommendations(
      assessment.hollandCode,
      assessment.educationLevelAtTest,
      null,
      {
        scores: {
          R: assessment.scoreR,
          I: assessment.scoreI,
          A: assessment.scoreA,
          S: assessment.scoreS,
          E: assessment.scoreE,
          C: assessment.scoreC,
        },
        displayCode,
      }
    );

    return { assessment, recommendations };
  },

  getResultsForPdf: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId', 'userType', 'gradeLevel'] }]
    });

    if (!assessment || assessment.status !== 'completed') {
      throw new NotFoundError('Completed assessment not found', 'COMPLETED_ASSESSMENT_NOT_FOUND');
    }

    const isOwner = assessment.userId === userId;
    const isAdmin = userRole === 'System Administrator';
    const isCounselor = userRole === 'Test Administrator';
    if (!isOwner && !isAdmin && !isCounselor) {
      throw new ForbiddenError('Not authorized', 'RESULTS_NOT_AUTHORIZED');
    }

    let recommendations = { occupations: [], courses: [], suggestedSubjects: [] };
    const { displayCode } = scoringService.buildHollandCodes({
      R: assessment.scoreR,
      I: assessment.scoreI,
      A: assessment.scoreA,
      S: assessment.scoreS,
      E: assessment.scoreE,
      C: assessment.scoreC,
    }, 0);
    assessment.setDataValue('hollandCodeDisplay', displayCode);

    try {
      recommendations = await scoringService.getRecommendations(
        assessment.hollandCode,
        assessment.educationLevelAtTest,
        null,
        {
          scores: {
            R: assessment.scoreR,
            I: assessment.scoreI,
            A: assessment.scoreA,
            S: assessment.scoreS,
            E: assessment.scoreE,
            C: assessment.scoreC,
          },
          displayCode,
        }
      );
    } catch (_) {}

    return { assessment, recommendations };
  }
};

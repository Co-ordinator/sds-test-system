'use strict';

const { Assessment, Answer, Question, User } = require('../models');
const { Op } = require('sequelize');
const scoringService = require('./scoring.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors/appError');
const {
  ASSESSMENT_CORE_ATTRIBUTES,
  getAssessmentDatabaseColumns
} = require('../utils/assessmentColumns');

const ASSESSMENT_CORE_DATABASE_COLUMNS = getAssessmentDatabaseColumns(Assessment);

const QUESTION_COUNT_CACHE_MS = 60 * 1000;
let questionCountCache = { value: null, expiresAt: 0 };

const getTotalQuestionCount = async () => {
  const now = Date.now();
  if (Number.isInteger(questionCountCache.value) && questionCountCache.expiresAt > now) {
    return questionCountCache.value;
  }

  const value = await Question.count();
  questionCountCache = { value, expiresAt: now + QUESTION_COUNT_CACHE_MS };
  return value;
};

const attachHollandCodeDisplay = (assessment) => {
  if (!assessment) return assessment;
  if (assessment.status !== 'completed' && !assessment.hollandCode) {
    assessment.setDataValue?.('hollandCodeDisplay', null);
    return assessment;
  }

  assessment.setDataValue?.(
    'hollandCodeDisplay',
    scoringService.getAssessmentDisplayCode(assessment, assessment.hollandCode || null) || null
  );
  return assessment;
};

module.exports = {

  /* ─── Assessment Lifecycle ────────────────────────────────────────────── */

  startAssessment: async (userId) => {
    const existing = await Assessment.findOne({
      where: { userId, status: 'in_progress' },
      attributes: ASSESSMENT_CORE_ATTRIBUTES,
      order: [['createdAt', 'DESC']]
    });

    if (existing) {
      return { assessment: existing, resumed: true };
    }

    const assessment = await Assessment.create(
      {
        userId,
        status: 'in_progress',
        progress: 0
      },
      {
        fields: ['userId', 'status', 'progress'],
        // Explicit RETURNING arrays are raw SQL column names in Sequelize.
        // Use physical snake_case names so PostgreSQL never receives "scoreR" etc.
        returning: ASSESSMENT_CORE_DATABASE_COLUMNS
      }
    );

    return { assessment, resumed: false };
  },

  listMyAssessments: async (userId) => {
    const assessments = await Assessment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      attributes: ASSESSMENT_CORE_ATTRIBUTES
    });
    return assessments.map(attachHollandCodeDisplay);
  },

  getAssessment: async (assessmentId, userId) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId },
      attributes: ASSESSMENT_CORE_ATTRIBUTES
    });
    if (!assessment) throw new NotFoundError('Assessment not found', 'ASSESSMENT_NOT_FOUND');
    return attachHollandCodeDisplay(assessment);
  },

  /* ─── Progress Management ─────────────────────────────────────────────── */

  getProgress: async (assessmentId, userId) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId },
      attributes: ASSESSMENT_CORE_ATTRIBUTES
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
      where: { id: assessmentId, userId },
      attributes: ASSESSMENT_CORE_ATTRIBUTES
    });
    if (!assessment || assessment.status !== 'in_progress') {
      throw new NotFoundError('Assessment not found or not in progress', 'ASSESSMENT_NOT_IN_PROGRESS');
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new BadRequestError('answers array is required', 'INVALID_ANSWERS_PAYLOAD');
    }

    const totalQuestions = await getTotalQuestionCount();

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

    let answeredCount = 0;
    const transaction = await Assessment.sequelize.transaction();
    try {
      if (validRows.length > 0) {
        await Answer.bulkCreate(validRows, {
          updateOnDuplicate: ['value', 'section', 'riasec_type', 'updated_at'],
          transaction
        });
      }

      answeredCount = await Answer.count({ where: { assessmentId }, transaction });
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
      where: { id: assessmentId, userId },
      attributes: ASSESSMENT_CORE_ATTRIBUTES
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
    const assessment = await Assessment.findByPk(assessmentId, {
      attributes: ASSESSMENT_CORE_ATTRIBUTES,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId', 'userType', 'gradeLevel', 'degreeProgram', 'yearOfStudy', 'yearsExperience']
      }]
    });

    if (!assessment || assessment.status !== 'completed') {
      throw new NotFoundError('Results not found', 'RESULTS_NOT_FOUND');
    }

    const isOwner = assessment.userId === userId;
    const isStaff = ['System Administrator', 'Test Administrator'].includes(userRole);
    if (!isOwner && !isStaff) {
      throw new ForbiddenError('Not authorized to view these results', 'RESULTS_NOT_AUTHORIZED');
    }

    const scores = scoringService.getScoreTotals(assessment);
    const displayCode = scoringService.getAssessmentDisplayCode(assessment, assessment.hollandCode || '');
    assessment.setDataValue('hollandCodeDisplay', displayCode || assessment.hollandCode);

    const recommendations = await scoringService.getRecommendations(
      assessment.hollandCode,
      assessment.educationLevelAtTest,
      null,
      {
        scores,
        displayCode,
        userType: assessment.user?.userType,
        degreeProgram: assessment.user?.degreeProgram,
        yearOfStudy: assessment.user?.yearOfStudy,
        yearsExperience: assessment.user?.yearsExperience
      }
    );

    return { assessment, recommendations };
  },

  getResultsForPdf: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId, {
      attributes: ASSESSMENT_CORE_ATTRIBUTES,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId', 'userType', 'gradeLevel', 'degreeProgram', 'yearOfStudy', 'yearsExperience'] }]
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
    const scores = scoringService.getScoreTotals(assessment);
    const displayCode = scoringService.getAssessmentDisplayCode(assessment, assessment.hollandCode || '');
    assessment.setDataValue('hollandCodeDisplay', displayCode || assessment.hollandCode);

    try {
      recommendations = await scoringService.getRecommendations(
        assessment.hollandCode,
        assessment.educationLevelAtTest,
        null,
        {
          scores,
          displayCode,
          userType: assessment.user?.userType,
          degreeProgram: assessment.user?.degreeProgram,
          yearOfStudy: assessment.user?.yearOfStudy,
          yearsExperience: assessment.user?.yearsExperience
        }
      );
    } catch (_) {}

    return { assessment, recommendations };
  }
};

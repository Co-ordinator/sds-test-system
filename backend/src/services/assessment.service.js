'use strict';

const { Assessment, Answer, Question, User } = require('../models');
const { Op } = require('sequelize');
const scoringService = require('./scoring.service');

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
    if (!assessment) throw new Error('Assessment not found');
    return assessment;
  },

  /* ─── Progress Management ─────────────────────────────────────────────── */

  getProgress: async (assessmentId, userId) => {
    const assessment = await Assessment.findOne({
      where: { id: assessmentId, userId }
    });
    if (!assessment) throw new Error('Assessment not found');

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
      throw new Error('Assessment not found or not in progress');
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('answers array is required');
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

    const answeredCount = await Answer.count({ where: { assessmentId } });
    const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

    await Assessment.update(
      { progress: progress.toFixed(2) },
      { where: { id: assessmentId } }
    );

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
      throw new Error('Assessment not found or not in progress');
    }

    const answeredCount = await Answer.count({ where: { assessmentId } });
    if (answeredCount < 228) {
      const error = new Error('Assessment is incomplete');
      error.answered = answeredCount;
      throw error;
    }

    const results = await scoringService.finalizeAssessment(assessmentId);
    return results;
  },

  getResults: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId);

    if (!assessment || assessment.status !== 'completed') {
      throw new Error('Results not found');
    }

    const isOwner = assessment.userId === userId;
    const isStaff = ['System Administrator', 'Test Administrator'].includes(userRole);
    if (!isOwner && !isStaff) {
      throw new Error('Not authorized to view these results');
    }

    const recommendations = await scoringService.getRecommendations(
      assessment.hollandCode,
      assessment.educationLevelAtTest
    );

    return { assessment, recommendations };
  },

  getResultsForPdf: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId', 'userType', 'gradeLevel'] }]
    });

    if (!assessment || assessment.status !== 'completed') {
      throw new Error('Completed assessment not found');
    }

    const isOwner = assessment.userId === userId;
    const isAdmin = userRole === 'System Administrator';
    const isCounselor = userRole === 'Test Administrator';
    if (!isOwner && !isAdmin && !isCounselor) {
      throw new Error('Not authorized');
    }

    let recommendations = { occupations: [], courses: [], suggestedSubjects: [] };
    try {
      recommendations = await scoringService.getRecommendations(
        assessment.hollandCode,
        assessment.educationLevelAtTest
      );
    } catch (_) {}

    return { assessment, recommendations };
  }
};

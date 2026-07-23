const express = require('express');
const { verifyToken } = require('../middleware/authentication.middleware');
const { User } = require('../models');
const assessmentService = require('../services/assessment.service');
const { sendEmail } = require('../config/email.config');
const logger = require('../utils/logger');
const { NotFoundError } = require('../utils/errors/appError');

const router = express.Router();
router.use(verifyToken);

const RIASEC_LABELS = {
  R: 'Realistic',
  I: 'Investigative',
  A: 'Artistic',
  S: 'Social',
  E: 'Enterprising',
  C: 'Conventional'
};

const normalizedRiasecScores = (assessment) => {
  const raw = {
    R: Number(assessment.scoreR || 0),
    I: Number(assessment.scoreI || 0),
    A: Number(assessment.scoreA || 0),
    S: Number(assessment.scoreS || 0),
    E: Number(assessment.scoreE || 0),
    C: Number(assessment.scoreC || 0)
  };
  const max = Math.max(...Object.values(raw));
  if (max <= 0) return raw;
  return Object.fromEntries(
    Object.entries(raw).map(([key, score]) => [key, Math.round((score / max) * 100)])
  );
};

const occupationRecommendations = (recommendations) =>
  (recommendations?.occupations || []).slice(0, 5).map((occupation) => {
    const relevance = Number(
      occupation.getDataValue?.('relevanceScore') ?? occupation.relevanceScore ?? 0
    );
    return {
      title: occupation.getDataValue?.('displayName') || occupation.displayName || occupation.name,
      matchPercentage: Math.min(100, Math.round(relevance / 3)),
      field: RIASEC_LABELS[String(occupation.primaryRiasec || '').toUpperCase()] || 'General'
    };
  });

const getLatestCompleted = async (userId) => {
  const assessments = await assessmentService.listMyAssessments(userId);
  return assessments.find((assessment) => assessment.status === 'completed') || null;
};

router.get('/', async (req, res, next) => {
  try {
    const assessments = await assessmentService.listMyAssessments(req.user.id);
    const results = assessments.map((assessment) => ({
      id: assessment.id,
      testName: 'SDS Career Assessment',
      status: assessment.status,
      hollandCode: assessment.hollandCodeDisplay || assessment.hollandCode || null,
      score: assessment.progress != null ? Number(assessment.progress) : null,
      completedAt: assessment.completedAt,
      createdAt: assessment.createdAt
    }));
    res.status(200).json({ status: 'success', data: { results } });
  } catch (error) {
    next(error);
  }
});

router.get('/overview', async (req, res, next) => {
  try {
    const latest = await getLatestCompleted(req.user.id);
    if (!latest) return res.status(200).json({ status: 'success', data: null });

    const { assessment, recommendations } = await assessmentService.getResults(
      latest.id,
      req.user.id,
      req.user.role
    );
    return res.status(200).json({
      status: 'success',
      data: {
        hollandCode: assessment.hollandCodeDisplay || assessment.hollandCode || null,
        riasecScores: normalizedRiasecScores(assessment),
        recommendations: occupationRecommendations(recommendations)
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/email', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user?.email) {
      throw new NotFoundError('No email address is registered on your account.', 'EMAIL_MISSING');
    }

    const latest = await getLatestCompleted(req.user.id);
    if (!latest) {
      throw new NotFoundError('Complete an assessment before emailing your results.', 'NO_COMPLETED_ASSESSMENT');
    }

    const { assessment, recommendations } = await assessmentService.getResults(
      latest.id,
      req.user.id,
      req.user.role
    );
    const scores = normalizedRiasecScores(assessment);
    const displayCode = assessment.hollandCodeDisplay || assessment.hollandCode || '';
    const delivery = await sendEmail({
      email: user.email,
      subject: 'Your SDS Career Assessment Results',
      template: 'test-results',
      context: {
        firstName: user.firstName || 'Test Taker',
        currentYear: new Date().getFullYear(),
        hollandCode: displayCode,
        hollandLabel: displayCode
          .split('')
          .map((letter) => RIASEC_LABELS[letter])
          .filter(Boolean)
          .join(' - '),
        completedAt: assessment.completedAt
          ? new Date(assessment.completedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
          : '',
        scores: Object.entries(scores).map(([letter, score]) => ({
          letter,
          label: RIASEC_LABELS[letter],
          score
        })),
        recommendations: occupationRecommendations(recommendations)
      }
    });

    logger.info({
      actionType: 'SYSTEM',
      message: `Assessment results emailed to user ${req.user.id}`,
      req,
      details: { assessmentId: assessment.id, messageId: delivery.messageId }
    });

    res.status(200).json({
      status: 'success',
      message: `Your results have been sent to ${user.email}.`
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

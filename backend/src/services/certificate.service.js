'use strict';

const { Certificate, Assessment, Answer, User, Institution } = require('../models');
const { Op } = require('sequelize');
const scoringService = require('./scoring.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors/appError');

const SCORE_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];

const attachAssessmentDisplayCode = (assessment) => {
  if (!assessment) return assessment;
  const totals = SCORE_KEYS.reduce((acc, key) => {
    acc[key] = Number(assessment?.[`score${key}`] ?? assessment?.get?.(`score${key}`) ?? 0);
    return acc;
  }, {});
  if (!SCORE_KEYS.some((key) => totals[key] > 0)) {
    assessment.setDataValue?.('hollandCodeDisplay', assessment.hollandCode || null);
    return assessment;
  }
  assessment.setDataValue?.('hollandCodeDisplay', assessment.hollandCode || null);
  return assessment;
};

const attachCertificateDisplayCode = (certificate) => {
  attachAssessmentDisplayCode(certificate?.assessment);
  return certificate;
};

const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];

const pad = (n, w = 4) => String(n).padStart(w, '0');

async function makeCertNumber() {
  const year = new Date().getFullYear();
  const count = await Certificate.count({
    where: { generatedAt: { [Op.gte]: new Date(`${year}-01-01`) } }
  });
  return `SDS/${year}/${pad(count + 1)}`;
}

module.exports = {

  computeSectionScores: async (assessmentId) => {
    const answers = await Answer.findAll({ where: { assessmentId } });
    const sections = {};
    ['activities', 'competencies', 'occupations', 'self_estimates'].forEach(s => {
      sections[s] = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    });
    answers.forEach(ans => {
      const sec = ans.section;
      const type = ans.riasecType;
      if (!sections[sec] || !type) return;
      if (['activities', 'competencies', 'occupations'].includes(sec)) {
        if (ans.value?.toUpperCase() === 'YES') sections[sec][type] += 1;
      } else if (sec === 'self_estimates') {
        const rating = parseInt(ans.value, 10);
        if (!isNaN(rating)) sections[sec][type] += rating;
      }
    });
    return sections;
  },

  /* ─── Generate (create/upsert) certificate ─────────────────────────────── */
  generateCertificate: async (assessmentId, generatedBy, options = {}) => {
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{
        model: User,
        as: 'user',
        attributes: [
          'id', 'firstName', 'lastName', 'email', 'nationalId', 'studentCode',
          'institutionId', 'currentInstitution', 'region', 'district'
        ],
        include: [{ model: Institution, as: 'institution', attributes: ['id', 'name', 'region', 'district'] }]
      }]
    });

    if (!assessment) throw new NotFoundError('Assessment not found', 'ASSESSMENT_NOT_FOUND');
    if (options.ownerUserId && assessment.userId !== options.ownerUserId) {
      throw new ForbiddenError('Not authorized', 'CERTIFICATE_NOT_AUTHORIZED');
    }
    if (assessment.status !== 'completed') {
      throw new BadRequestError('Assessment must be completed before issuing a certificate', 'ASSESSMENT_NOT_COMPLETED');
    }

    let cert = await Certificate.findOne({ where: { assessmentId } });
    if (!cert) {
      const certNumber = await makeCertNumber();
      cert = await Certificate.create({
        assessmentId,
        userId: assessment.userId,
        generatedBy,
        generatedAt: new Date(),
        certNumber
      });
    }

    return { cert, assessment };
  },

  /* ─── Get data for PDF download ────────────────────────────────────────── */
  getDownloadData: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{
        model: User,
        as: 'user',
        include: [{ model: Institution, as: 'institution', attributes: ['id', 'name', 'region', 'district'] }]
      }]
    });

    if (!assessment || assessment.status !== 'completed') {
      throw new NotFoundError('Completed assessment not found', 'COMPLETED_ASSESSMENT_NOT_FOUND');
    }

    const isOwner = assessment.userId === userId;
    const isAdmin = userRole === 'System Administrator';
    const isCounselor = userRole === 'Test Administrator';
    if (!isOwner && !isAdmin && !isCounselor) {
      throw new ForbiddenError('Not authorized', 'CERTIFICATE_NOT_AUTHORIZED');
    }

    const cert = await Certificate.findOne({ where: { assessmentId } });
    if (!cert) {
      throw new NotFoundError('Certificate has not been generated yet. Please contact your administrator.', 'CERTIFICATE_NOT_GENERATED');
    }

    const sectionScores = await module.exports.computeSectionScores(assessmentId);
    const totals = {
      R: assessment.scoreR || 0,
      I: assessment.scoreI || 0,
      A: assessment.scoreA || 0,
      S: assessment.scoreS || 0,
      E: assessment.scoreE || 0,
      C: assessment.scoreC || 0
    };
    const hasScores = RIASEC_KEYS.some((key) => Number(totals[key]) > 0);
    const { displayCode } = hasScores
      ? scoringService.buildHollandCodes(totals, 0)
      : { displayCode: assessment.hollandCode || '' };
    const primaryCode = assessment.hollandCode || scoringService.normalizeHollandCode(displayCode);
    const hollandLetters = scoringService.parseDisplayCodeGroups(primaryCode)
      .slice(0, 3)
      .map((group) => group.join('/'));

    let occupationNames = [];
    try {
      const recs = await scoringService.getRecommendations(
        assessment.hollandCode,
        assessment.educationLevelAtTest,
        null,
        {
          scores: totals,
          displayCode,
        }
      );
      occupationNames = (recs.occupations || []).slice(0, 3).map(o => o.name);
    } catch (_) {}

    const generatedDate = cert.generatedAt
      ? new Date(cert.generatedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    return { assessment, cert, sectionScores, hollandLetters, occupationNames, generatedDate, isOwner };
  },

  /* ─── List all certificates (admin) ────────────────────────────────────── */
  listCertificates: async () => {
    const certs = await Certificate.findAll({
      include: [{
        model: Assessment,
        as: 'assessment',
        attributes: ['id', 'hollandCode', 'scoreR', 'scoreI', 'scoreA', 'scoreS', 'scoreE', 'scoreC', 'completedAt', 'status'],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      }],
      order: [['generatedAt', 'DESC']],
      limit: 500
    });
    return certs.map(attachCertificateDisplayCode);
  },

  /* ─── Check if certificate exists ──────────────────────────────────────── */
  checkCertificate: async (assessmentId, userId, userRole) => {
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment || (assessment.userId !== userId && userRole !== 'System Administrator' && userRole !== 'Test Administrator')) {
      throw new ForbiddenError('Not authorized', 'CERTIFICATE_NOT_AUTHORIZED');
    }
    const cert = await Certificate.findOne({ where: { assessmentId } });
    return { available: !!cert, certNumber: cert?.certNumber || null, generatedAt: cert?.generatedAt || null };
  },

  /* ─── My certificates (user) ────────────────────────────────────────────── */
  myCertificates: async (userId) => {
    const certs = await Certificate.findAll({
      where: { userId },
      include: [{
        model: Assessment,
        as: 'assessment',
        attributes: ['id', 'hollandCode', 'scoreR', 'scoreI', 'scoreA', 'scoreS', 'scoreE', 'scoreC', 'completedAt']
      }],
      order: [['generatedAt', 'DESC']]
    });
    return certs.map(attachCertificateDisplayCode);
  }
};

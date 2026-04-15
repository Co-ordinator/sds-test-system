'use strict';

const { Certificate, Assessment, Answer, User } = require('../models');
const { Op } = require('sequelize');
const scoringService = require('./scoring.service');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/errors/appError');

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
  generateCertificate: async (assessmentId, generatedBy) => {
    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId'] }]
    });

    if (!assessment) throw new NotFoundError('Assessment not found', 'ASSESSMENT_NOT_FOUND');
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
      include: [{ model: User, as: 'user' }]
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
    const hollandCode = assessment.hollandCode || '';
    const hollandLetters = hollandCode.replace(/\//g, '').split('').filter(c => 'RIASEC'.includes(c)).slice(0, 3);

    let occupationNames = [];
    try {
      const { displayCode } = scoringService.buildHollandCodes({
        R: assessment.scoreR,
        I: assessment.scoreI,
        A: assessment.scoreA,
        S: assessment.scoreS,
        E: assessment.scoreE,
        C: assessment.scoreC,
      }, 0);
      const recs = await scoringService.getRecommendations(
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
      occupationNames = (recs.occupations || []).slice(0, 3).map(o => o.name);
    } catch (_) {}

    const generatedDate = cert.generatedAt
      ? new Date(cert.generatedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    return { assessment, cert, sectionScores, hollandLetters, occupationNames, generatedDate, isOwner };
  },

  /* ─── List all certificates (admin) ────────────────────────────────────── */
  listCertificates: async () => {
    return await Certificate.findAll({
      include: [{
        model: Assessment,
        as: 'assessment',
        attributes: ['id', 'hollandCode', 'completedAt', 'status'],
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      }],
      order: [['generatedAt', 'DESC']],
      limit: 500
    });
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
    return await Certificate.findAll({
      where: { userId },
      include: [{ model: Assessment, as: 'assessment', attributes: ['id', 'hollandCode', 'completedAt'] }],
      order: [['generatedAt', 'DESC']]
    });
  }
};

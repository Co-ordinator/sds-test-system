'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { Certificate, Assessment, Answer, User, AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const scoringService = require('../services/scoring.service');
const logger = require('../utils/logger');

const LOGO_PATH = path.join(__dirname, '../../../frontend/public/siyinqaba.png');

const SECTION_MAP = {
  activities: 'I',
  competencies: 'II',
  occupations: 'III',
  self_estimates: 'IV'
};

const SECTION_LABELS = {
  activities: 'Activity',
  competencies: 'Competence',
  occupations: 'Occupation',
  self_estimates: 'Abilities'
};

const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];

/**
 * Compute per-section RIASEC scores from answers.
 * activities/competencies/occupations: YES=1, NO=0
 * self_estimates: numeric rating as-is
 */
async function computeSectionScores(assessmentId) {
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
}

/**
 * Pad a number to given width.
 */
const pad = (n, w = 4) => String(n).padStart(w, '0');

/**
 * Generate a cert number: SDS/YYYY/NNNN
 */
async function makeCertNumber() {
  const year = new Date().getFullYear();
  const count = await Certificate.count({
    where: { generatedAt: { [Op.gte]: new Date(`${year}-01-01`) } }
  });
  return `SDS/${year}/${pad(count + 1)}`;
}

/**
 * Build the SDS Certificate PDF and pipe it to a writable stream.
 */
async function buildCertificatePdf(res, assessment, sectionScores, hollandLetters, occupationNames, certNumber, generatedDate) {
  const doc = new PDFDocument({ size: 'A4', margin: 60, bufferPages: true });
  doc.pipe(res);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const lm = 60;   // left margin
  const rm = 60;   // right margin
  const contentW = pageW - lm - rm;

  // ── HEADER ─────────────────────────────────────────────────────────────
  // "GOVERNMENT" on left
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
  doc.text('GOVERNMENT', lm, 50);

  // "OF   ESWATINI" on right (right-aligned)
  const rightHeaderText = 'OF   ESWATINI';
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
  doc.text(rightHeaderText, lm, 50, { width: contentW, align: 'right' });

  // Logo in center
  if (fs.existsSync(LOGO_PATH)) {
    try {
      const logoWidth = 70;
      const logoCenterX = (pageW - logoWidth) / 2;
      doc.image(LOGO_PATH, logoCenterX, 42, { width: logoWidth });
    } catch (_) {}
  }

  // Contact info below header
  const subY = 88;
  doc.font('Helvetica').fontSize(7.5).fillColor('#000000');
  doc.text('Tel:  +268 4041971/2/3', lm, subY);
  doc.text('Fax: +268 4049889', lm, subY + 10);

  // Right side contact
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
  doc.text('Principal Secretary\'s Office', lm, subY, { width: contentW, align: 'right' });
  doc.font('Helvetica').fontSize(7.5);
  doc.text('Ministry of Labour & Social Security', lm, subY + 10, { width: contentW, align: 'right' });
  doc.text('P.O. Box 198, Mbabane H100', lm, subY + 20, { width: contentW, align: 'right' });

  doc.font('Helvetica').fontSize(7.5).fillColor('#000000');
  doc.text('Email:mkhaliphit@gov.sz', lm, subY + 32);

  // Horizontal rule
  const ruleY = subY + 50;
  doc.moveTo(lm, ruleY).lineTo(pageW - rm, ruleY).strokeColor('#000000').lineWidth(0.8).stroke();

  // ── TITLE ──────────────────────────────────────────────────────────────
  const titleY = ruleY + 12;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
  doc.text('SELF-DIRECTED –SEARCH (SDS) SUMMARY SHEET    CERTIFICATE', lm, titleY, { width: contentW, align: 'center', underline: false });

  // ── SCORE TABLE ────────────────────────────────────────────────────────
  const tableY = titleY + 22;
  const colWidths = [90, 62, 68, 58, 55, 70, 68]; // Sections + 6 RIASEC cols
  const totalTableW = colWidths.reduce((a, b) => a + b, 0);
  const tableX = lm + (contentW - totalTableW) / 2;
  const rowH = 28;

  const headers = ['Sections', 'Realistic\nR', 'Investigative\nI', 'Artistic\nA', 'Social\nS', 'Enterprising\nE', 'Conventional\nC'];

  // Draw header row
  let cx = tableX;
  headers.forEach((h, i) => {
    doc.rect(cx, tableY, colWidths[i], rowH).strokeColor('#000000').lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
    const lines = h.split('\n');
    const textH = lines.length * 8;
    const textY = tableY + (rowH - textH) / 2;
    lines.forEach((line, li) => {
      doc.text(line, cx + 2, textY + li * 8, { width: colWidths[i] - 4, align: 'center' });
    });
    cx += colWidths[i];
  });

  // Data rows
  const sections = ['activities', 'competencies', 'occupations', 'self_estimates'];
  sections.forEach((sec, si) => {
    const rowY = tableY + rowH * (si + 1);
    let cx2 = tableX;

    // Sections column
    doc.rect(cx2, rowY, colWidths[0], rowH).strokeColor('#000000').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(7).fillColor('#000000');
    const sLabel = `Section ${SECTION_MAP[sec]}\n${SECTION_LABELS[sec]}`;
    const sLines = sLabel.split('\n');
    sLines.forEach((line, li) => {
      doc.text(line, cx2 + 4, rowY + 6 + li * 9, { width: colWidths[0] - 8 });
    });
    cx2 += colWidths[0];

    // RIASEC value columns
    RIASEC_KEYS.forEach((key, ki) => {
      doc.rect(cx2, rowY, colWidths[ki + 1], rowH).strokeColor('#000000').lineWidth(0.5).stroke();
      const score = (sectionScores[sec] || {})[key] || 0;
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
      doc.text(String(score), cx2 + 2, rowY + (rowH - 9) / 2, { width: colWidths[ki + 1] - 4, align: 'center' });
      cx2 += colWidths[ki + 1];
    });
  });

  // Total Score row
  const totalRowY = tableY + rowH * (sections.length + 1);
  let cx3 = tableX;
  doc.rect(cx3, totalRowY, colWidths[0], rowH).strokeColor('#000000').lineWidth(0.5).stroke();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
  doc.text('Total Score', cx3 + 4, totalRowY + (rowH - 8) / 2, { width: colWidths[0] - 8 });
  cx3 += colWidths[0];

  const totals = { R: assessment.scoreR || 0, I: assessment.scoreI || 0, A: assessment.scoreA || 0, S: assessment.scoreS || 0, E: assessment.scoreE || 0, C: assessment.scoreC || 0 };
  RIASEC_KEYS.forEach((key, ki) => {
    doc.rect(cx3, totalRowY, colWidths[ki + 1], rowH).strokeColor('#000000').lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
    doc.text(String(totals[key]), cx3 + 2, totalRowY + (rowH - 10) / 2, { width: colWidths[ki + 1] - 4, align: 'center' });
    cx3 += colWidths[ki + 1];
  });

  // ── YOUR SDS CODE ──────────────────────────────────────────────────────
  const sdcY = totalRowY + rowH + 20;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
  doc.text('YOUR SDS CODE', lm, sdcY, { width: contentW, align: 'center' });

  const codeTableW = totalTableW;
  const codeTableX = tableX;
  const codeColW = codeTableW / 3;
  const codeRowH = 40;
  const codeY = sdcY + 12;
  const codeHeaders = ['Letter of Highest Score', 'Letter of Second Highest Score', 'Letter of Third Highest Score'];

  codeHeaders.forEach((h, i) => {
    const cx4 = codeTableX + i * codeColW;
    doc.rect(cx4, codeY, codeColW, 18).strokeColor('#000000').lineWidth(0.5).stroke();
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
    doc.text(h, cx4 + 2, codeY + 5, { width: codeColW - 4, align: 'center' });

    // Value cell
    doc.rect(cx4, codeY + 18, codeColW, codeRowH).strokeColor('#000000').lineWidth(0.5).stroke();
    const letter = hollandLetters[i] || '';
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
    doc.text(letter, cx4 + 2, codeY + 18 + (codeRowH - 18) / 2, { width: codeColW - 4, align: 'center' });
  });

  // ── PLANNED OCCUPATIONS ────────────────────────────────────────────────
  let occY = codeY + 18 + codeRowH + 28;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
  doc.text('Planned Occupations:  1.', lm, occY);

  const occ1 = occupationNames[0] || '';
  if (occ1) {
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    doc.text(occ1, lm + 150, occY);
  }

  occY += 32;
  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  doc.text('2.', lm + 120, occY);
  if (occupationNames[1]) doc.text(occupationNames[1], lm + 150, occY);

  occY += 32;
  doc.text('3.', lm + 120, occY);
  if (occupationNames[2]) doc.text(occupationNames[2], lm + 150, occY);

  // ── SIGNATURE BLOCK ────────────────────────────────────────────────────
  const sigY = pageH - 170;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
  doc.text('THULANI E. MKHALIPHI', lm, sigY + 28);
  doc.text('PRINCIPAL SECRETARY', lm, sigY + 40);

  // Simple signature line (underline style)
  doc.moveTo(lm, sigY + 22).lineTo(lm + 140, sigY + 22).strokeColor('#000000').lineWidth(0.5).stroke();

  // ── PAGE NUMBER ─────────────────────────────────────────────────────────
  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  doc.text('25', lm, pageH - 40, { width: contentW, align: 'center' });

  doc.end();
}

// ── Admin: generate certificate for a completed assessment ─────────────────
module.exports.generateCertificate = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId'] }]
    });

    if (!assessment) return res.status(404).json({ status: 'error', message: 'Assessment not found' });
    if (assessment.status !== 'completed') {
      return res.status(400).json({ status: 'error', message: 'Assessment must be completed before issuing a certificate' });
    }

    // Check for existing certificate
    let cert = await Certificate.findOne({ where: { assessmentId } });

    if (!cert) {
      const certNumber = await makeCertNumber();
      cert = await Certificate.create({
        assessmentId,
        userId: assessment.userId,
        generatedBy: req.user.id,
        generatedAt: new Date(),
        certNumber
      });
    }

    // Create notification for the student (user-targeted AuditLog)
    try {
      await AuditLog.create({
        userId: assessment.userId,
        actionType: 'CERTIFICATE_READY',
        description: `Your SDS Certificate (${cert.certNumber}) is ready for download.`,
        details: {
          assessmentId,
          certId: cert.id,
          certNumber: cert.certNumber,
          isRead: false,
          targetUserId: assessment.userId
        },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'system'
      });
    } catch (_) { /* notification failure must not break flow */ }

    logger.info({ actionType: 'CERTIFICATE_GENERATED', message: `Certificate ${cert.certNumber} generated for assessment ${assessmentId}`, req });

    res.json({
      status: 'success',
      data: {
        certId: cert.id,
        certNumber: cert.certNumber,
        generatedAt: cert.generatedAt,
        assessmentId
      }
    });
  } catch (err) {
    next(err);
  }
};

// ── Download certificate PDF ────────────────────────────────────────────────
module.exports.downloadCertificate = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findByPk(assessmentId, {
      include: [{ model: User, as: 'user' }]
    });

    if (!assessment || assessment.status !== 'completed') {
      return res.status(404).json({ status: 'error', message: 'Completed assessment not found' });
    }

    // Auth: owner, admin, or counselor
    const isOwner = assessment.userId === req.user.id;
    const isAdmin = req.user.role === 'System Administrator';
    const isCounselor = req.user.role === 'Test Administrator';
    if (!isOwner && !isAdmin && !isCounselor) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }

    // Certificate must exist (must be generated by admin first)
    const cert = await Certificate.findOne({ where: { assessmentId } });
    if (!cert) {
      return res.status(404).json({ status: 'error', message: 'Certificate has not been generated yet. Please contact your administrator.' });
    }

    // Per-section scores
    const sectionScores = await computeSectionScores(assessmentId);

    // Holland code letters (top 3 unique)
    const hollandCode = assessment.hollandCode || '';
    const hollandLetters = hollandCode.replace(/\//g, '').split('').filter(c => 'RIASEC'.includes(c)).slice(0, 3);

    // Top 3 occupations
    let occupationNames = [];
    try {
      const recs = await scoringService.getRecommendations(assessment.hollandCode, assessment.educationLevelAtTest);
      occupationNames = (recs.occupations || []).slice(0, 3).map(o => o.name);
    } catch (_) {}

    const student = assessment.user || {};
    const generatedDate = cert.generatedAt ? new Date(cert.generatedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SDS_Certificate_${cert.certNumber.replace(/\//g, '-')}.pdf"`);

    await buildCertificatePdf(res, assessment, sectionScores, hollandLetters, occupationNames, cert.certNumber, generatedDate);

    logger.info({ actionType: 'CERTIFICATE_DOWNLOADED', message: `Certificate ${cert.certNumber} downloaded`, req });

    // Mark notification as read when downloaded by owner
    if (isOwner) {
      AuditLog.update(
        { details: sequelize.fn('jsonb_set', sequelize.col('details'), '{isRead}', 'true') },
        { where: { actionType: 'CERTIFICATE_READY', details: { assessmentId } } }
      ).catch(() => {});
    }
  } catch (err) {
    next(err);
  }
};

// ── Admin: list all certificates ────────────────────────────────────────────
module.exports.listCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.findAll({
      include: [
        {
          model: Assessment,
          as: 'assessment',
          attributes: ['id', 'hollandCode', 'completedAt', 'status'],
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }]
        }
      ],
      order: [['generatedAt', 'DESC']],
      limit: 500
    });
    res.json({ status: 'success', data: { certificates: certs } });
  } catch (err) { next(err); }
};

// ── User: check if certificate exists for an assessment ─────────────────────
module.exports.checkCertificate = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment || (assessment.userId !== req.user.id && req.user.role !== 'System Administrator' && req.user.role !== 'Test Administrator')) {
      return res.status(403).json({ status: 'error', message: 'Not authorized' });
    }
    const cert = await Certificate.findOne({ where: { assessmentId } });
    res.json({
      status: 'success',
      data: { available: !!cert, certNumber: cert?.certNumber || null, generatedAt: cert?.generatedAt || null }
    });
  } catch (err) { next(err); }
};

// ── User: list my available certificates ────────────────────────────────────
module.exports.myCertificates = async (req, res, next) => {
  try {
    const certs = await Certificate.findAll({
      where: { userId: req.user.id },
      include: [{ model: Assessment, as: 'assessment', attributes: ['id', 'hollandCode', 'completedAt'] }],
      order: [['generatedAt', 'DESC']]
    });
    res.json({ status: 'success', data: { certificates: certs } });
  } catch (err) { next(err); }
};

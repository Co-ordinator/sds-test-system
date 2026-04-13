'use strict';

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { AuditLog, sequelize } = require('../models');
const certificateService = require('../services/certificate.service');
const logger = require('../utils/logger');

const LOGO_PATHS = [
  path.join(__dirname, '../../assets/siyinqaba.png'),
  path.join(__dirname, '../../../frontend/public/siyinqaba.png'),
];

const resolveLogoPath = () => LOGO_PATHS.find((logoPath) => fs.existsSync(logoPath));

const SECTION_MAP = { activities: 'I', competencies: 'II', occupations: 'III', self_estimates: 'IV' };
const SECTION_LABELS = { activities: 'Activity', competencies: 'Competence', occupations: 'Occupation', self_estimates: 'Abilities' };
const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];

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
  const border = '#6b7280';

  // ── HEADER ─────────────────────────────────────────────────────────────
  // "GOVERNMENT" on left
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
  doc.text('GOVERNMENT', lm + 8, 48);

  // "OF   ESWATINI" on right (right-aligned)
  const rightHeaderText = 'OF   ESWATINI';
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
  doc.text(rightHeaderText, lm, 48, { width: contentW - 8, align: 'right' });

  // Logo in center
  const logoPath = resolveLogoPath();
  if (logoPath) {
    try {
      const logoWidth = 78;
      const logoCenterX = (pageW - logoWidth) / 2;
      doc.image(logoPath, logoCenterX, 38, { width: logoWidth });
    } catch (_) {}
  }

  // Contact info below header
  const subY = 94;
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
  doc.text('Email: mkhaliphi@gov.sz', lm, subY + 32);

  // Horizontal rule
  const ruleY = subY + 48;
  doc.moveTo(lm, ruleY).lineTo(pageW - rm, ruleY).strokeColor('#000000').lineWidth(0.8).stroke();

  // ── TITLE ──────────────────────────────────────────────────────────────
  const titleY = ruleY + 10;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#000000');
  doc.text('SELF-DIRECTED –SEARCH (SDS) SUMMARY SHEET   CERTIFICATE', lm, titleY, { width: contentW, align: 'center', underline: false });

  // ── SCORE TABLE ────────────────────────────────────────────────────────
  const tableY = titleY + 18;
  const colWidths = [84, 58, 66, 58, 58, 66, 74]; // Sections + 6 RIASEC cols
  const totalTableW = colWidths.reduce((a, b) => a + b, 0);
  const tableX = lm + (contentW - totalTableW) / 2;
  const rowH = 26;

  const headers = ['Sections', 'Realistic\nR', 'Investigative\nI', 'Artistic\nA', 'Social\nS', 'Enterprising\nE', 'Conventional\nC'];

  // Draw header row
  let cx = tableX;
  headers.forEach((h, i) => {
    doc.rect(cx, tableY, colWidths[i], rowH).strokeColor(border).lineWidth(0.45).stroke();
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
    doc.rect(cx2, rowY, colWidths[0], rowH).strokeColor(border).lineWidth(0.45).stroke();
    doc.font('Helvetica').fontSize(7).fillColor('#000000');
    const sLabel = `Section ${SECTION_MAP[sec]}\n${SECTION_LABELS[sec]}`;
    const sLines = sLabel.split('\n');
    sLines.forEach((line, li) => {
      doc.text(line, cx2 + 4, rowY + 5 + li * 8.5, { width: colWidths[0] - 8 });
    });
    cx2 += colWidths[0];

    // RIASEC value columns
    RIASEC_KEYS.forEach((key, ki) => {
      doc.rect(cx2, rowY, colWidths[ki + 1], rowH).strokeColor(border).lineWidth(0.45).stroke();
      const score = (sectionScores[sec] || {})[key] || 0;
      doc.font('Helvetica').fontSize(9).fillColor('#000000');
      doc.text(String(score), cx2 + 2, rowY + (rowH - 10) / 2, { width: colWidths[ki + 1] - 4, align: 'center' });
      cx2 += colWidths[ki + 1];
    });
  });

  // Total Score row
  const totalRowY = tableY + rowH * (sections.length + 1);
  let cx3 = tableX;
  doc.rect(cx3, totalRowY, colWidths[0], rowH).strokeColor(border).lineWidth(0.45).stroke();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#000000');
  doc.text('Total Score', cx3 + 4, totalRowY + (rowH - 8) / 2, { width: colWidths[0] - 8 });
  cx3 += colWidths[0];

  const totals = { R: assessment.scoreR || 0, I: assessment.scoreI || 0, A: assessment.scoreA || 0, S: assessment.scoreS || 0, E: assessment.scoreE || 0, C: assessment.scoreC || 0 };
  RIASEC_KEYS.forEach((key, ki) => {
    doc.rect(cx3, totalRowY, colWidths[ki + 1], rowH).strokeColor(border).lineWidth(0.45).stroke();
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
    doc.text(String(totals[key]), cx3 + 2, totalRowY + (rowH - 10) / 2, { width: colWidths[ki + 1] - 4, align: 'center' });
    cx3 += colWidths[ki + 1];
  });

  // ── YOUR SDS CODE ──────────────────────────────────────────────────────
  const sdcY = totalRowY + rowH + 18;
  doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000');
  doc.text('YOUR SDS CODE', lm, sdcY, { width: contentW, align: 'center' });

  const codeTableW = totalTableW;
  const codeTableX = tableX;
  const codeColW = codeTableW / 3;
  const codeRowH = 38;
  const codeY = sdcY + 12;
  const codeHeaders = ['Letter of Highest Score', 'Letter of Second Highest Score', 'Letter of Third Highest Score'];

  codeHeaders.forEach((h, i) => {
    const cx4 = codeTableX + i * codeColW;
    doc.rect(cx4, codeY, codeColW, 18).strokeColor(border).lineWidth(0.45).stroke();
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#000000');
    doc.text(h, cx4 + 2, codeY + 5, { width: codeColW - 4, align: 'center' });

    // Value cell
    doc.rect(cx4, codeY + 18, codeColW, codeRowH).strokeColor(border).lineWidth(0.45).stroke();
    const letter = hollandLetters[i] || '';
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000');
    doc.text(letter, cx4 + 2, codeY + 18 + (codeRowH - 18) / 2, { width: codeColW - 4, align: 'center' });
  });

  // ── PLANNED OCCUPATIONS ────────────────────────────────────────────────
  let occY = codeY + 18 + codeRowH + 20;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
  doc.text('Planned Occupations:  1.', lm, occY);

  const occ1 = occupationNames[0] || '';
  if (occ1) {
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    doc.text(occ1, lm + 150, occY);
  }

  occY += 28;
  doc.font('Helvetica').fontSize(9).fillColor('#000000');
  doc.text('2.', lm + 120, occY);
  if (occupationNames[1]) doc.text(occupationNames[1], lm + 150, occY);

  occY += 28;
  doc.text('3.', lm + 120, occY);
  if (occupationNames[2]) doc.text(occupationNames[2], lm + 150, occY);

  // ── SIGNATURE BLOCK ────────────────────────────────────────────────────
  const sigY = pageH - 158;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
  doc.text('THULANI E. MKHALIPHI', lm, sigY + 28);
  doc.text('PRINCIPAL SECRETARY', lm, sigY + 40);

  // Simple signature line (underline style)
  doc.moveTo(lm, sigY + 22).lineTo(lm + 140, sigY + 22).strokeColor('#000000').lineWidth(0.5).stroke();

  doc.end();
}

// ── Admin: generate certificate for a completed assessment ─────────────────
module.exports.generateCertificate = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { cert, assessment } = await certificateService.generateCertificate(assessmentId, req.user.id);

    try {
      await AuditLog.create({
        userId: assessment.userId,
        actionType: 'CERTIFICATE_READY',
        description: `Your SDS Certificate (${cert.certNumber}) is ready for download.`,
        details: { assessmentId, certId: cert.id, certNumber: cert.certNumber, isRead: false, targetUserId: assessment.userId },
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'system'
      });
    } catch (_) {}

    logger.info({ actionType: 'CERTIFICATE_GENERATED', message: `Certificate ${cert.certNumber} generated for assessment ${assessmentId}`, req });
    res.json({ status: 'success', data: { certId: cert.id, certNumber: cert.certNumber, generatedAt: cert.generatedAt, assessmentId } });
  } catch (err) {
    if (err.message === 'Assessment not found') return res.status(404).json({ status: 'error', message: err.message });
    if (err.status === 400) return res.status(400).json({ status: 'error', message: err.message });
    next(err);
  }
};

// ── Download certificate PDF ────────────────────────────────────────────────
module.exports.downloadCertificate = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, cert, sectionScores, hollandLetters, occupationNames, generatedDate, isOwner } =
      await certificateService.getDownloadData(assessmentId, req.user.id, req.user.role);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SDS_Certificate_${cert.certNumber.replace(/\//g, '-')}.pdf"`);

    await buildCertificatePdf(res, assessment, sectionScores, hollandLetters, occupationNames, cert.certNumber, generatedDate);

    logger.info({ actionType: 'CERTIFICATE_DOWNLOADED', message: `Certificate ${cert.certNumber} downloaded`, req });

    if (isOwner) {
      AuditLog.update(
        { details: sequelize.fn('jsonb_set', sequelize.col('details'), '{isRead}', 'true') },
        { where: { actionType: 'CERTIFICATE_READY', details: { assessmentId } } }
      ).catch(() => {});
    }
  } catch (err) {
    if (err.message === 'Completed assessment not found') return res.status(404).json({ status: 'error', message: err.message });
    if (err.message === 'Certificate has not been generated yet. Please contact your administrator.') return res.status(404).json({ status: 'error', message: err.message });
    if (err.status === 403) return res.status(403).json({ status: 'error', message: err.message });
    next(err);
  }
};

// ── Admin: list all certificates ────────────────────────────────────────────
module.exports.listCertificates = async (req, res, next) => {
  try {
    const certs = await certificateService.listCertificates();
    res.json({ status: 'success', data: { certificates: certs } });
  } catch (err) { next(err); }
};

// ── User: check if certificate exists for an assessment ─────────────────────
module.exports.checkCertificate = async (req, res, next) => {
  try {
    const data = await certificateService.checkCertificate(req.params.assessmentId, req.user.id, req.user.role);
    res.json({ status: 'success', data });
  } catch (err) {
    if (err.status === 403) return res.status(403).json({ status: 'error', message: err.message });
    next(err);
  }
};

// ── User: list my available certificates ────────────────────────────────────
module.exports.myCertificates = async (req, res, next) => {
  try {
    const certs = await certificateService.myCertificates(req.user.id);
    res.json({ status: 'success', data: { certificates: certs } });
  } catch (err) { next(err); }
};

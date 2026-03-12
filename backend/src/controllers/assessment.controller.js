const scoringService = require('../services/scoring.service');
const { Assessment, Answer, Question, User } = require('../models');
const { Op } = require('sequelize');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const RIASEC_LABELS = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
const RIASEC_COLORS = { R: '#dc2626', I: '#2563eb', A: '#7c3aed', S: '#059669', E: '#d97706', C: '#1e3a5f' };
const RIASEC_DESC = {
  R: 'Practical and hands-on. Enjoys working with tools, machines, and physical objects.',
  I: 'Analytical and intellectual. Enjoys research, mathematics, and science.',
  A: 'Creative and expressive. Enjoys art, music, writing, and drama.',
  S: 'Empathetic and people-oriented. Enjoys teaching, counseling, and community service.',
  E: 'Ambitious and leadership-oriented. Enjoys business, management, and persuading others.',
  C: 'Organized and detail-oriented. Enjoys working with data, numbers, and structured processes.'
};
const DEMAND_LABELS = { critical: 'Critical', very_high: 'Very High', high: 'High', medium: 'Medium', low: 'Low' };
const DEMAND_PDF_COLORS = { critical: '#dc2626', very_high: '#ea580c', high: '#d97706', medium: '#2563eb', low: '#6b7280' };

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
   * Get saved answers for an in-progress assessment (used to restore progress on page refresh).
   */
  async getProgress(req, res, next) {
    try {
      const { assessmentId } = req.params;
      const assessment = await Assessment.findOne({
        where: { id: assessmentId, userId: req.user.id }
      });
      if (!assessment) {
        return res.status(404).json({ status: 'error', message: 'Assessment not found' });
      }
      const saved = await Answer.findAll({
        where: { assessmentId },
        attributes: ['questionId', 'value']
      });
      const answers = {};
      saved.forEach((a) => { answers[a.questionId] = a.value; });
      return res.status(200).json({ status: 'success', data: { answers } });
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
        attributes: ['id', 'text', 'section', 'riasecType', 'order', 'questionCode']
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
      const isStaff = ['System Administrator', 'Test Administrator'].includes(req.user.role);
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

  /**
   * Generate a full PDF Career Report for a completed assessment.
   * Enterprise-grade layout with colorful charts, embedded logo, and Holland Code interpretation.
   */
  async downloadResultsPdf(req, res, next) {
    try {
      const assessmentId = req.params.assessmentId;
      const assessment = await Assessment.findByPk(assessmentId, {
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId', 'userType', 'gradeLevel'] }]
      });

      if (!assessment || assessment.status !== 'completed') {
        return res.status(404).json({ status: 'error', message: 'Completed assessment not found' });
      }

      const isOwner = assessment.userId === req.user.id;
      const isAdmin = req.user.role === 'System Administrator';
      const isCounselor = req.user.role === 'Test Administrator';
      if (!isOwner && !isAdmin && !isCounselor) {
        return res.status(403).json({ status: 'error', message: 'Not authorized' });
      }

      let recommendations = { occupations: [], courses: [], suggestedSubjects: [] };
      try {
        recommendations = await scoringService.getRecommendations(
          assessment.hollandCode,
          assessment.educationLevelAtTest
        );
      } catch (_) {}

      const student = assessment.user || {};
      const studentName = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student';
      const hollandCode = assessment.hollandCode || '';
      const scores = {
        R: assessment.scoreR ?? 0, I: assessment.scoreI ?? 0, A: assessment.scoreA ?? 0,
        S: assessment.scoreS ?? 0, E: assessment.scoreE ?? 0, C: assessment.scoreC ?? 0
      };
      const occupations = recommendations.occupations || [];
      const courses = recommendations.courses || [];
      const subjects = recommendations.suggestedSubjects || [];
      const dateStr = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
      const hollandLetters = hollandCode.split('').filter(c => RIASEC_LABELS[c]);

      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CareerReport_${assessmentId}.pdf"`);
      doc.pipe(res);

      const govBlue = '#1e3a5f';
      const pageWidth = doc.page.width - 100;
      const pageHeight = doc.page.height;
      const leftMargin = 50;

      let logoPath = path.join(__dirname, '../../../frontend/public/siyinqaba.png');
      if (!fs.existsSync(logoPath)) logoPath = null;

      const drawFooter = () => {
        doc.save();
        doc.moveTo(leftMargin, pageHeight - 55).lineTo(leftMargin + pageWidth, pageHeight - 55)
          .strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.fillColor('#9ca3af').fontSize(7).font('Helvetica')
          .text('Eswatini National Career Guidance Platform \u00b7 Ministry of Labour \u00b7 careers.gov.sz',
            leftMargin, pageHeight - 45, { width: pageWidth, align: 'center' });
        doc.fillColor('#9ca3af').fontSize(6)
          .text(`Generated: ${dateStr}`, leftMargin, pageHeight - 35, { width: pageWidth, align: 'center' });
        doc.restore();
      };

      // ══ PAGE 1: Header, Info, RIASEC Radar + Bars, Holland Code ══
      doc.rect(leftMargin, 30, pageWidth, 55).fill(govBlue);
      if (logoPath) {
        try { doc.image(logoPath, leftMargin + 8, 35, { height: 45 }); } catch (_) {}
      }
      const titleX = logoPath ? leftMargin + 65 : leftMargin + 15;
      doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
        .text('CAREER ASSESSMENT REPORT', titleX, 42);
      doc.fontSize(8).font('Helvetica')
        .text('Kingdom of Eswatini \u00b7 Ministry of Labour and Social Security', titleX, 60);

      // Student information box
      const infoBoxY = 95;
      doc.roundedRect(leftMargin, infoBoxY, pageWidth, 50, 4).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.fillColor(govBlue).fontSize(9).font('Helvetica-Bold');
      doc.text('Name:', leftMargin + 12, infoBoxY + 10);
      doc.text('Holland Code:', leftMargin + 12, infoBoxY + 26);
      doc.text('Date:', leftMargin + 260, infoBoxY + 10);
      if (student.gradeLevel) doc.text('Grade:', leftMargin + 260, infoBoxY + 26);
      doc.fillColor('#374151').fontSize(9).font('Helvetica');
      doc.text(studentName, leftMargin + 70, infoBoxY + 10);
      doc.text(dateStr, leftMargin + 300, infoBoxY + 10);
      if (student.gradeLevel) doc.text(student.gradeLevel, leftMargin + 300, infoBoxY + 26);

      // Holland Code colored letter boxes
      let hcX = leftMargin + 100;
      hollandLetters.forEach(c => {
        doc.roundedRect(hcX, infoBoxY + 22, 18, 18, 3).fill(RIASEC_COLORS[c] || govBlue);
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold').text(c, hcX + 4.5, infoBoxY + 25);
        hcX += 22;
      });
      doc.fillColor('#6b7280').fontSize(7.5).font('Helvetica')
        .text(hollandLetters.map(c => RIASEC_LABELS[c]).join(' \u00b7 '), hcX + 4, infoBoxY + 28);

      // RIASEC Radar Chart (hexagonal)
      const radarSectionY = 160;
      doc.fillColor(govBlue).fontSize(11).font('Helvetica-Bold')
        .text('Your RIASEC Profile', leftMargin, radarSectionY);
      doc.moveTo(leftMargin, radarSectionY + 14).lineTo(leftMargin + pageWidth, radarSectionY + 14)
        .strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      const cx = leftMargin + 130;
      const cy = radarSectionY + 105;
      const maxR = 75;
      const keys = ['R', 'I', 'A', 'S', 'E', 'C'];
      const angles = keys.map((_, i) => (i * 60 - 90) * Math.PI / 180);
      const maxScore = Math.max(...Object.values(scores), 1);

      // 3 concentric hexagons
      for (let level = 1; level <= 3; level++) {
        const r = (level / 3) * maxR;
        const pts = angles.map(a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]);
        doc.save();
        doc.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(p => doc.lineTo(p[0], p[1]));
        doc.closePath().strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.restore();
      }

      // Axis lines
      angles.forEach(a => {
        doc.save();
        doc.moveTo(cx, cy).lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a))
          .strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.restore();
      });

      // Score polygon filled
      const scorePts = keys.map((key, i) => {
        const r = (scores[key] / maxScore) * maxR;
        return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
      });
      doc.save();
      doc.moveTo(scorePts[0][0], scorePts[0][1]);
      scorePts.slice(1).forEach(p => doc.lineTo(p[0], p[1]));
      doc.closePath().fillOpacity(0.2).fill(govBlue);
      doc.restore();

      // Score polygon stroke
      doc.save();
      doc.moveTo(scorePts[0][0], scorePts[0][1]);
      scorePts.slice(1).forEach(p => doc.lineTo(p[0], p[1]));
      doc.closePath().strokeColor(govBlue).lineWidth(2).stroke();
      doc.restore();

      // Score dots and axis labels
      keys.forEach((key, i) => {
        const r = (scores[key] / maxScore) * maxR;
        const dx = cx + r * Math.cos(angles[i]);
        const dy = cy + r * Math.sin(angles[i]);
        doc.circle(dx, dy, 3).fill(RIASEC_COLORS[key]);
        const labelR = maxR + 14;
        const lx = cx + labelR * Math.cos(angles[i]);
        const ly = cy + labelR * Math.sin(angles[i]);
        doc.fillColor(RIASEC_COLORS[key]).fontSize(9).font('Helvetica-Bold')
          .text(key, lx - 4, ly - 5, { width: 10 });
      });

      // RIASEC Score Bars (right side)
      const barsX = leftMargin + 280;
      const barsY = radarSectionY + 22;
      const barWidth = 200;
      doc.fillColor(govBlue).fontSize(9).font('Helvetica-Bold')
        .text('Score Breakdown', barsX, barsY);

      keys.forEach((key, i) => {
        const rowY = barsY + 18 + i * 24;
        const score = scores[key];
        const pct = (score / maxScore) * barWidth;
        const color = RIASEC_COLORS[key];
        doc.roundedRect(barsX, rowY, 16, 16, 2).fill(color);
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(key, barsX + 4, rowY + 3);
        doc.fillColor('#374151').fontSize(8).font('Helvetica').text(RIASEC_LABELS[key], barsX + 22, rowY + 3);
        doc.roundedRect(barsX + 90, rowY + 2, barWidth, 10, 3).fill('#f3f4f6');
        if (pct > 0) doc.roundedRect(barsX + 90, rowY + 2, Math.max(pct, 6), 10, 3).fill(color);
        doc.fillColor(color).fontSize(8.5).font('Helvetica-Bold').text(`${score}`, barsX + 90 + barWidth + 8, rowY + 2);
      });

      // Holland Code Interpretation
      const hcSectionY = radarSectionY + 200;
      doc.fillColor(govBlue).fontSize(11).font('Helvetica-Bold')
        .text('Your Holland Code Interpretation', leftMargin, hcSectionY);
      doc.moveTo(leftMargin, hcSectionY + 14).lineTo(leftMargin + pageWidth, hcSectionY + 14)
        .strokeColor('#e5e7eb').lineWidth(0.5).stroke();

      hollandLetters.slice(0, 3).forEach((c, i) => {
        const cardY = hcSectionY + 20 + i * 42;
        const color = RIASEC_COLORS[c];
        doc.roundedRect(leftMargin, cardY, 4, 34, 2).fill(color);
        doc.circle(leftMargin + 18, cardY + 10, 8).fill(color);
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold').text(`${i + 1}`, leftMargin + 14, cardY + 6);
        doc.fillColor(color).fontSize(10).font('Helvetica-Bold')
          .text(`${RIASEC_LABELS[c]} (${c})`, leftMargin + 32, cardY + 4);
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
          .text(RIASEC_DESC[c], leftMargin + 32, cardY + 18, { width: pageWidth - 40 });
      });

      // Suggested Subjects
      let curY = hcSectionY + 20 + Math.min(hollandLetters.length, 3) * 42 + 10;
      if (subjects.length > 0) {
        if (curY > 680) { doc.addPage(); curY = 50; }
        doc.fillColor(govBlue).fontSize(11).font('Helvetica-Bold')
          .text('Suggested School Subjects', leftMargin, curY);
        doc.moveTo(leftMargin, curY + 14).lineTo(leftMargin + pageWidth, curY + 14)
          .strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        curY += 20;
        let pillX = leftMargin;
        subjects.forEach(s => {
          const tw = doc.widthOfString(s) + 16;
          if (pillX + tw > leftMargin + pageWidth) { pillX = leftMargin; curY += 18; }
          doc.roundedRect(pillX, curY, tw, 16, 8).fill('#ecfdf5');
          doc.fillColor('#059669').fontSize(7.5).font('Helvetica-Bold').text(s, pillX + 8, curY + 3.5);
          pillX += tw + 6;
        });
        curY += 24;
      }

      drawFooter();

      // ══ PAGE 2: Career Recommendations ══
      if (occupations.length > 0) {
        doc.addPage();
        doc.rect(leftMargin, 30, pageWidth, 28).fill(govBlue);
        doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
          .text('RECOMMENDED CAREER PATHS', leftMargin + 15, 38);

        let occY = 70;
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
          .text('Careers aligned with your Holland Code profile. Demand levels indicate local labour market outlook.', leftMargin, occY);
        occY += 18;

        occupations.slice(0, 10).forEach((occ) => {
          if (occY > 700) { doc.addPage(); occY = 50; }
          const rLetter = occ.primaryRiasec || hollandLetters[0] || 'R';
          const color = RIASEC_COLORS[rLetter] || govBlue;

          doc.roundedRect(leftMargin, occY, 18, 18, 3).fill(color);
          doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(rLetter, leftMargin + 5, occY + 4);
          doc.fillColor('#111827').fontSize(9.5).font('Helvetica-Bold')
            .text(occ.name, leftMargin + 24, occY + 1);

          const demand = occ.localDemand || occ.demandLevel;
          if (demand) {
            const dColor = DEMAND_PDF_COLORS[demand] || '#6b7280';
            const dLabel = DEMAND_LABELS[demand] || demand;
            const dX = leftMargin + 24 + doc.widthOfString(occ.name) + 8;
            doc.roundedRect(dX, occY + 1, doc.widthOfString(dLabel) + 14, 13, 6).fill(dColor + '20');
            doc.fillColor(dColor).fontSize(7).font('Helvetica-Bold').text(dLabel, dX + 7, occY + 4);
          }

          if (occ.description) {
            doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
              .text(occ.description, leftMargin + 24, occY + 14, { width: pageWidth - 30 });
            occY += 8;
          }
          occY += 26;
        });

        drawFooter();
      }

      // ══ PAGE 3: Courses & Qualifications ══
      if (courses.length > 0) {
        doc.addPage();
        doc.rect(leftMargin, 30, pageWidth, 28).fill(govBlue);
        doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
          .text('RECOMMENDED COURSES & QUALIFICATIONS', leftMargin + 15, 38);

        let crsY = 70;
        doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
          .text('Study programmes aligned to your profile with entry requirements and institutions.', leftMargin, crsY);
        crsY += 18;

        courses.slice(0, 12).forEach((course) => {
          if (crsY > 690) { doc.addPage(); crsY = 50; }
          const qualType = course.qualificationType ? course.qualificationType.toUpperCase() : '';

          if (qualType) {
            const qw = doc.widthOfString(qualType) + 12;
            doc.roundedRect(leftMargin, crsY, qw, 14, 4).fill('#e8eef4');
            doc.fillColor(govBlue).fontSize(7).font('Helvetica-Bold').text(qualType, leftMargin + 6, crsY + 3);
          }

          doc.fillColor(govBlue).fontSize(9.5).font('Helvetica-Bold')
            .text(course.name, leftMargin + (qualType ? doc.widthOfString(qualType) + 18 : 0), crsY + 1);
          crsY += 18;

          if (course.description) {
            doc.fillColor('#374151').fontSize(8).font('Helvetica')
              .text(course.description, leftMargin + 10, crsY, { width: pageWidth - 20 });
            crsY += doc.heightOfString(course.description, { width: pageWidth - 20, fontSize: 8 }) + 4;
          }

          const reqs = course.requirements || [];
          if (reqs.length > 0) {
            doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text('Entry Requirements:', leftMargin + 10, crsY);
            crsY += 12;
            reqs.forEach(r => {
              const mColor = r.isMandatory ? govBlue : '#9ca3af';
              doc.fillColor(mColor).fontSize(7.5).font('Helvetica')
                .text(`${r.subject}: ${r.minimumGrade}${r.isMandatory ? '' : ' (recommended)'}`, leftMargin + 20, crsY);
              crsY += 11;
            });
          }

          const insts = (course.courseInstitutions || []).map(ci => ci.institution?.name).filter(Boolean);
          if (insts.length > 0) {
            doc.fillColor('#2563eb').fontSize(8).font('Helvetica-Bold').text('Offered at:', leftMargin + 10, crsY);
            crsY += 12;
            let instX = leftMargin + 20;
            insts.forEach(name => {
              const tw = doc.widthOfString(name) + 14;
              if (instX + tw > leftMargin + pageWidth) { instX = leftMargin + 20; crsY += 16; }
              doc.roundedRect(instX, crsY, tw, 14, 7).fill('#e8eef4');
              doc.fillColor(govBlue).fontSize(7).font('Helvetica-Bold').text(name, instX + 7, crsY + 3);
              instX += tw + 4;
            });
            crsY += 20;
          }

          doc.moveTo(leftMargin, crsY).lineTo(leftMargin + pageWidth, crsY)
            .strokeColor('#f3f4f6').lineWidth(0.5).stroke();
          crsY += 10;
        });

        drawFooter();
      }

      doc.end();
    } catch (error) {
      logger.error({
        actionType: 'PDF_GENERATION_FAILED',
        message: `PDF generation failed for assessment ${req.params.assessmentId}`,
        req,
        details: { error: error.message, stack: error.stack }
      });
      return next(error);
    }
  }
}

module.exports = new AssessmentController();
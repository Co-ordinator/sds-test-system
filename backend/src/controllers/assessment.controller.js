const assessmentService = require('../services/assessment.service');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

const RIASEC_LABELS = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' };
const RIASEC_COLORS = { R: '#F44336', I: '#2563eb', A: '#7c3aed', S: '#059669', E: '#d97706', C: '#2D8BC4' };
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
  async startAssessment(req, res, next) {
    try {
      const { assessment, resumed } = await assessmentService.startAssessment(req.user.id);
      logger.info({ actionType: 'TEST_START', message: `Assessment ${resumed ? 'resumed' : 'started'} for user ${req.user.id}`, req, details: { assessmentId: assessment.id, userId: req.user.id } });
      return res.status(resumed ? 200 : 201).json({ status: 'success', data: { assessment, resumed } });
    } catch (error) {
      logger.error({ actionType: 'ASSESSMENT_START_FAILED', message: 'Failed to start assessment', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }

  async listMyAssessments(req, res, next) {
    try {
      const assessments = await assessmentService.listMyAssessments(req.user.id);
      return res.status(200).json({ status: 'success', data: { assessments } });
    } catch (error) {
      logger.error({ actionType: 'ASSESSMENT_LIST_FAILED', message: 'Failed to list assessments', req, details: { error: error.message } });
      return next(error);
    }
  }

  async getAssessment(req, res, next) {
    try {
      const assessment = await assessmentService.getAssessment(req.params.assessmentId, req.user.id);
      return res.status(200).json({ status: 'success', data: { assessment } });
    } catch (error) {
      if (error.message === 'Assessment not found') return res.status(404).json({ status: 'error', message: error.message });
      return next(error);
    }
  }

  async getProgress(req, res, next) {
    try {
      const answers = await assessmentService.getProgress(req.params.assessmentId, req.user.id);
      return res.status(200).json({ status: 'success', data: { answers } });
    } catch (error) {
      if (error.message === 'Assessment not found') return res.status(404).json({ status: 'error', message: error.message });
      return next(error);
    }
  }

  async getQuestions(req, res, next) {
    try {
      const questions = await assessmentService.getQuestions(req.query.section);
      return res.status(200).json({ status: 'success', data: { questions } });
    } catch (error) {
      logger.error({ actionType: 'QUESTIONS_FETCH_FAILED', message: 'Failed to fetch questions', req, details: { error: error.message } });
      return next(error);
    }
  }

  async saveProgress(req, res, next) {
    try {
      const { progress, answeredCount } = await assessmentService.saveProgress(req.params.assessmentId, req.user.id, req.body.answers);
      logger.info({ actionType: 'ASSESSMENT_PROGRESS_SAVED', message: `Progress saved for assessment ${req.params.assessmentId}`, req, details: { assessmentId: req.params.assessmentId, answeredCount, progress } });
      return res.status(200).json({ status: 'success', data: { progress } });
    } catch (error) {
      if (error.message === 'Assessment not found or not in progress') return res.status(404).json({ status: 'error', message: error.message });
      if (error.message === 'answers array is required') return res.status(400).json({ status: 'error', message: error.message });
      logger.error({ actionType: 'ASSESSMENT_PROGRESS_FAILED', message: 'Failed to save progress', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }

  async submitAssessment(req, res, next) {
    try {
      const results = await assessmentService.submitAssessment(req.params.assessmentId, req.user.id);
      logger.info({ actionType: 'ASSESSMENT_COMPLETED', message: `Assessment ${req.params.assessmentId} finalized`, req, details: { assessmentId: req.params.assessmentId, hollandCode: results.hollandCode } });
      return res.status(200).json({ status: 'success', data: { hollandCode: results.hollandCode, scores: results.scores, recommendations: results.recommendations } });
    } catch (error) {
      if (error.message === 'Assessment not found or not in progress') return res.status(404).json({ status: 'error', message: error.message });
      if (error.message === 'Assessment is incomplete') return res.status(400).json({ status: 'error', message: error.message, answered: error.answered });
      logger.error({ actionType: 'ASSESSMENT_COMPLETE_FAILED', message: `Failed to finalize assessment ${req.params.assessmentId}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }

  async getResults(req, res, next) {
    try {
      const { assessment, recommendations } = await assessmentService.getResults(req.params.assessmentId, req.user.id, req.user.role);
      logger.info({ actionType: 'ASSESSMENT_RESULTS_FETCHED', message: `Results fetched for assessment ${req.params.assessmentId}`, req, details: { assessmentId: req.params.assessmentId } });
      return res.status(200).json({ status: 'success', data: { assessment, recommendations } });
    } catch (error) {
      if (error.message === 'Results not found') return res.status(404).json({ status: 'error', message: error.message });
      if (error.message === 'Not authorized to view these results') return res.status(403).json({ status: 'error', message: error.message });
      logger.error({ actionType: 'ASSESSMENT_RESULTS_FAILED', message: `Failed to fetch results for assessment ${req.params.assessmentId}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }

  async downloadResultsPdf(req, res, next) {
    try {
      const { assessment, recommendations } = await assessmentService.getResultsForPdf(req.params.assessmentId, req.user.id, req.user.role);

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
      res.setHeader('Content-Disposition', `attachment; filename="CareerReport_${assessment.id}.pdf"`);
      doc.pipe(res);

      const govBlue = '#2D8BC4';
      const gold = '#FFEB3B';
      const text = '#111827';
      const muted = '#6b7280';
      const border = '#d1d5db';
      const stripe = '#f7f9fc';
      const pageWidth = doc.page.width - 100;
      const pageHeight = doc.page.height;
      const leftMargin = 50;

      let logoPath = path.join(__dirname, '../../../frontend/public/siyinqaba.png');
      if (!fs.existsSync(logoPath)) logoPath = null;

      const drawLetterhead = (title) => {
        doc.font('Helvetica-Bold').fontSize(18).fillColor(text);
        doc.text('GOVERNMENT', leftMargin + 10, 28);
        doc.text('OF   ESWATINI', leftMargin, 28, { width: pageWidth - 10, align: 'right' });
        if (logoPath) {
          try { doc.image(logoPath, (doc.page.width - 72) / 2, 18, { width: 72 }); } catch (_) {}
        }
        doc.font('Helvetica-Bold').fontSize(8).fillColor(text);
        doc.text('Tel:  +268 4041971/2/3', leftMargin, 74);
        doc.text('Fax: +268 4049889', leftMargin, 86);
        doc.text('Email: mkhaliphi@gov.sz', leftMargin, 98);
        doc.text('Principal Secretary\'s Office', leftMargin, 74, { width: pageWidth, align: 'right' });
        doc.font('Helvetica').fontSize(8);
        doc.text('Ministry of Labour & Social Security', leftMargin, 86, { width: pageWidth, align: 'right' });
        doc.text('P.O. Box 198, Mbabane H100', leftMargin, 98, { width: pageWidth, align: 'right' });
        doc.moveTo(leftMargin, 116).lineTo(leftMargin + pageWidth, 116).strokeColor('#000000').lineWidth(0.7).stroke();
        doc.font('Helvetica-Bold').fontSize(12).fillColor(text)
          .text(title, leftMargin, 128, { width: pageWidth, align: 'center' });
        doc.font('Helvetica').fontSize(7.5).fillColor(muted)
          .text(`Generated: ${dateStr}`, leftMargin, 144, { width: pageWidth, align: 'center' });
        doc.moveTo(leftMargin, 156).lineTo(leftMargin + pageWidth, 156).strokeColor(border).lineWidth(0.6).stroke();
      };

      // ══ PAGE 1: Header, Info, RIASEC Radar + Bars, Holland Code ══
      drawLetterhead('CAREER ASSESSMENT REPORT');

      // Student information box
      const infoBoxY = 170;
      doc.rect(leftMargin, infoBoxY, pageWidth, 50).strokeColor(border).lineWidth(0.8).stroke();
      doc.fillColor(govBlue).fontSize(9).font('Helvetica-Bold');
      doc.text('Name:', leftMargin + 12, infoBoxY + 10);
      doc.text('Holland Code:', leftMargin + 12, infoBoxY + 26);
      doc.text('Date:', leftMargin + 260, infoBoxY + 10);
      if (student.gradeLevel) doc.text('Grade:', leftMargin + 260, infoBoxY + 26);
      doc.fillColor(text).fontSize(9).font('Helvetica');
      doc.text(studentName, leftMargin + 70, infoBoxY + 10);
      doc.text(dateStr, leftMargin + 300, infoBoxY + 10);
      if (student.gradeLevel) doc.text(student.gradeLevel, leftMargin + 300, infoBoxY + 26);

      // Holland Code plain letter cells
      let hcX = leftMargin + 100;
      hollandLetters.forEach(c => {
        doc.rect(hcX, infoBoxY + 22, 18, 18).strokeColor(border).lineWidth(0.6).stroke();
        doc.fillColor(text).fontSize(10).font('Helvetica-Bold').text(c, hcX + 4.5, infoBoxY + 25);
        hcX += 22;
      });
      doc.fillColor(muted).fontSize(7.5).font('Helvetica')
        .text(hollandLetters.map(c => RIASEC_LABELS[c]).join(' · '), hcX + 4, infoBoxY + 28);

      // RIASEC Radar Chart (hexagonal)
      const radarSectionY = 240;
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
        doc.rect(barsX, rowY, 16, 16).strokeColor(border).lineWidth(0.6).stroke();
        doc.fillColor(text).fontSize(8).font('Helvetica-Bold').text(key, barsX + 4, rowY + 3);
        doc.fillColor('#374151').fontSize(8).font('Helvetica').text(RIASEC_LABELS[key], barsX + 22, rowY + 3);
        doc.rect(barsX + 90, rowY + 2, barWidth, 10).fill('#f3f4f6');
        if (pct > 0) doc.rect(barsX + 90, rowY + 2, Math.max(pct, 6), 10).fill(color);
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
        doc.rect(leftMargin, cardY, pageWidth, 34).strokeColor(border).lineWidth(0.6).stroke();
        doc.font('Helvetica-Bold').fontSize(10).fillColor(text)
          .text(`${i + 1}. ${RIASEC_LABELS[c]} (${c})`, leftMargin + 10, cardY + 6);
        doc.fillColor(muted).fontSize(8).font('Helvetica')
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
          doc.rect(pillX, curY, tw, 16).strokeColor(border).lineWidth(0.5).stroke();
          doc.fillColor(text).fontSize(7.5).font('Helvetica-Bold').text(s, pillX + 8, curY + 3.5);
          pillX += tw + 6;
        });
        curY += 24;
      }

      // ══ PAGE 2: Career Recommendations ══
      if (occupations.length > 0) {
        doc.addPage();
        drawLetterhead('RECOMMENDED CAREER PATHS');

        let occY = 170;
        doc.fillColor(muted).fontSize(8).font('Helvetica')
          .text('Careers aligned with your Holland Code profile. Demand levels indicate local labour market outlook.', leftMargin, occY);
        occY += 18;

        occupations.slice(0, 10).forEach((occ) => {
          if (occY > 700) { doc.addPage(); occY = 50; }
          const rLetter = occ.primaryRiasec || hollandLetters[0] || 'R';
          const color = RIASEC_COLORS[rLetter] || govBlue;

          doc.rect(leftMargin, occY, 18, 18).strokeColor(border).lineWidth(0.6).stroke();
          doc.fillColor(text).fontSize(9).font('Helvetica-Bold').text(rLetter, leftMargin + 5, occY + 4);
          doc.fillColor(text).fontSize(9.5).font('Helvetica-Bold')
            .text(occ.name, leftMargin + 24, occY + 1);

          const demand = occ.localDemand || occ.demandLevel;
          if (demand) {
            const dColor = DEMAND_PDF_COLORS[demand] || '#6b7280';
            const dLabel = DEMAND_LABELS[demand] || demand;
            const dX = leftMargin + 24 + doc.widthOfString(occ.name) + 8;
            doc.rect(dX, occY + 1, doc.widthOfString(dLabel) + 14, 13).strokeColor(border).lineWidth(0.5).stroke();
            doc.fillColor(dColor).fontSize(7).font('Helvetica-Bold').text(dLabel, dX + 7, occY + 4);
          }

          if (occ.description) {
            doc.fillColor(muted).fontSize(8).font('Helvetica')
              .text(occ.description, leftMargin + 24, occY + 14, { width: pageWidth - 30 });
            occY += 8;
          }
          doc.moveTo(leftMargin, occY + 22).lineTo(leftMargin + pageWidth, occY + 22).strokeColor(border).lineWidth(0.5).stroke();
          occY += 26;
        });
      }

      // ══ PAGE 3: Courses & Qualifications ══
      if (courses.length > 0) {
        doc.addPage();
        drawLetterhead('RECOMMENDED COURSES & QUALIFICATIONS');

        let crsY = 170;
        doc.fillColor(muted).fontSize(8).font('Helvetica')
          .text('Study programmes aligned to your profile with entry requirements and institutions.', leftMargin, crsY);
        crsY += 18;

        courses.slice(0, 12).forEach((course) => {
          if (crsY > 690) { doc.addPage(); crsY = 50; }
          const qualType = course.qualificationType ? course.qualificationType.toUpperCase() : '';

          if (qualType) {
            const qw = doc.widthOfString(qualType) + 12;
            doc.rect(leftMargin, crsY, qw, 14).strokeColor(border).lineWidth(0.5).stroke();
            doc.fillColor(text).fontSize(7).font('Helvetica-Bold').text(qualType, leftMargin + 6, crsY + 3);
          }

          doc.fillColor(govBlue).fontSize(9.5).font('Helvetica-Bold')
            .text(course.name, leftMargin + (qualType ? doc.widthOfString(qualType) + 18 : 0), crsY + 1);

          crsY += 18;

          if (course.description) {
            doc.fillColor('#374151').fontSize(8).font('Helvetica')
              .text(course.description, leftMargin + 10, crsY, { width: pageWidth - 20 });
            crsY += doc.heightOfString(course.description, { width: pageWidth - 20, fontSize: 8 }) + 4;
          }

          const insts = (course.courseInstitutions || []).map(ci => ci.institution?.name).filter(Boolean);
          if (insts.length > 0) {
            doc.fillColor('#2563eb').fontSize(8).font('Helvetica-Bold').text('Offered at:', leftMargin + 10, crsY);
            crsY += 12;
            let instX = leftMargin + 20;
            insts.forEach(name => {
              const tw = doc.widthOfString(name) + 14;
              if (instX + tw > leftMargin + pageWidth) { instX = leftMargin + 20; crsY += 16; }
              doc.rect(instX, crsY, tw, 14).strokeColor(border).lineWidth(0.5).stroke();
              doc.fillColor(text).fontSize(7).font('Helvetica-Bold').text(name, instX + 7, crsY + 3);
              instX += tw + 4;
            });
            crsY += 20;
          }

          doc.moveTo(leftMargin, crsY).lineTo(leftMargin + pageWidth, crsY)
            .strokeColor('#f3f4f6').lineWidth(0.5).stroke();
          crsY += 10;
        });
      }

      doc.end();
    } catch (error) {
      if (error.message === 'Completed assessment not found') return res.status(404).json({ status: 'error', message: error.message });
      if (error.message === 'Not authorized') return res.status(403).json({ status: 'error', message: error.message });
      logger.error({ actionType: 'PDF_GENERATION_FAILED', message: `PDF generation failed for assessment ${req.params.assessmentId}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }
}

module.exports = new AssessmentController();
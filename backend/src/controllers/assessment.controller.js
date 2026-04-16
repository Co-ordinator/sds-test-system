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
const LOGO_PATHS = [
  process.env.PDF_LOGO_PATH ? path.resolve(process.env.PDF_LOGO_PATH) : null,
  path.join(__dirname, '../../assets/siyinqaba.png'),
  path.join(__dirname, '../../../frontend/public/siyinqaba.png'),
  path.join(process.cwd(), 'backend/assets/siyinqaba.png'),
  path.join(process.cwd(), 'frontend/public/siyinqaba.png'),
  path.join(process.cwd(), 'public_html/siyinqaba.png'),
  path.join(process.cwd(), 'siyinqaba.png'),
].filter(Boolean);

const resolveLogoPath = () => LOGO_PATHS.find((logoPath) => fs.existsSync(logoPath));

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
      return next(error);
    }
  }

  async getProgress(req, res, next) {
    try {
      const answers = await assessmentService.getProgress(req.params.assessmentId, req.user.id);
      return res.status(200).json({ status: 'success', data: { answers } });
    } catch (error) {
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
      logger.error({ actionType: 'ASSESSMENT_PROGRESS_FAILED', message: 'Failed to save progress', req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }

  async submitAssessment(req, res, next) {
    try {
      const results = await assessmentService.submitAssessment(req.params.assessmentId, req.user.id);
      logger.info({ actionType: 'ASSESSMENT_COMPLETED', message: `Assessment ${req.params.assessmentId} finalized`, req, details: { assessmentId: req.params.assessmentId, hollandCode: results.hollandCode } });
      return res.status(200).json({
        status: 'success',
        data: {
          hollandCode: results.hollandCode,
          hollandCodeDisplay: results.hollandCodeDisplay || results.hollandCode,
          scores: results.scores,
          recommendations: results.recommendations
        }
      });
    } catch (error) {
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
      logger.error({ actionType: 'ASSESSMENT_RESULTS_FAILED', message: `Failed to fetch results for assessment ${req.params.assessmentId}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }

  async downloadResultsPdf(req, res, next) {
    try {
      const { assessment, recommendations } = await assessmentService.getResultsForPdf(req.params.assessmentId, req.user.id, req.user.role);

      const student = assessment.user || {};
      const studentName = [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student';
      const hollandCode = assessment.hollandCodeDisplay || assessment.hollandCode || '';
      const scores = {
        R: assessment.scoreR ?? 0,
        I: assessment.scoreI ?? 0,
        A: assessment.scoreA ?? 0,
        S: assessment.scoreS ?? 0,
        E: assessment.scoreE ?? 0,
        C: assessment.scoreC ?? 0
      };
      const occupations = recommendations.occupations || [];
      const courses = recommendations.courses || [];
      const subjects = recommendations.suggestedSubjects || [];
      const fundingAlignment = recommendations.fundingAlignment || null;
      const generatedDate = new Date();
      const generatedDateStr = generatedDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
      const completedDate = assessment.completedAt
        ? new Date(assessment.completedAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
        : generatedDateStr;
      const riasecOrder = ['R', 'I', 'A', 'S', 'E', 'C'];
      const riasecOrderIndex = riasecOrder.reduce((acc, key, index) => ({ ...acc, [key]: index }), {});
      const scoreRows = ['R', 'I', 'A', 'S', 'E', 'C'].map((key) => ({
        key,
        label: RIASEC_LABELS[key],
        score: Number(scores[key] || 0),
        color: RIASEC_COLORS[key] || '#2D8BC4'
      }));
      const sortedScores = [...scoreRows].sort((a, b) => b.score - a.score || riasecOrderIndex[a.key] - riasecOrderIndex[b.key]);
      const scoreRankGroups = [];
      sortedScores.forEach((row) => {
        if (scoreRankGroups.length === 0) {
          scoreRankGroups.push([row]);
          return;
        }
        const lastGroup = scoreRankGroups[scoreRankGroups.length - 1];
        if (lastGroup[0].score === row.score) {
          lastGroup.push(row);
        } else {
          scoreRankGroups.push([row]);
        }
      });
      const parsedDisplayGroups = String(hollandCode || '')
        .toUpperCase()
        .trim()
        .split(/\s+/)
        .map((group) => group.split('/').map((letter) => letter.trim()).filter((letter) => RIASEC_LABELS[letter]))
        .filter((group) => group.length > 0);
      const hollandDisplayGroups = (parsedDisplayGroups.length > 0
        ? parsedDisplayGroups
        : scoreRankGroups.map((group) => group.map((row) => row.key)))
        .slice(0, 3);
      const hollandCodeDisplayText = hollandDisplayGroups.map((group) => group.join('/')).join(' ');
      const hollandCodeLabelText = hollandDisplayGroups
        .map((group) => group.map((letter) => RIASEC_LABELS[letter]).join('/'))
        .join(' - ');
      const topRankGroups = scoreRankGroups.slice(0, 3);
      const topThree = sortedScores.slice(0, 3);
      const topFive = sortedScores.slice(0, 5);
      const maxScore = Math.max(...scoreRows.map((row) => row.score), 1);
      const totalScore = scoreRows.reduce((sum, row) => sum + row.score, 0);

      const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CareerReport_${assessment.id}.pdf"`);
      doc.pipe(res);

      const govBlue = '#2D8BC4';
      const text = '#111827';
      const muted = '#6b7280';
      const border = '#d1d5db';
      const lightTrack = '#e5e7eb';
      const pageWidth = doc.page.width - 100;
      const pageHeight = doc.page.height;
      const leftMargin = 50;
      const bottomY = pageHeight - 56;

      const logoPath = resolveLogoPath();
      if (!logoPath) {
        logger.warn({
          actionType: 'PDF_LOGO_MISSING',
          message: 'Assessment PDF logo not found on disk',
          req,
          details: { attemptedPaths: LOGO_PATHS }
        });
      }

      const normalizeText = (value, fallback = 'Not provided') => {
        const clean = String(value ?? '').trim();
        return clean || fallback;
      };

      const measureText = (value, width, font = 'Helvetica', size = 8, options = {}) => {
        doc.font(font).fontSize(size);
        return doc.heightOfString(String(value || ''), { width, ...options });
      };

      const formatQualification = (value) => {
        const labels = {
          certificate: 'Certificate',
          diploma: 'Diploma',
          bachelor: "Bachelor's Degree",
          honours: 'Honours Degree',
          postgrad_diploma: 'Postgraduate Diploma',
          masters: "Master's Degree",
          doctorate: 'Doctorate',
          short_course: 'Short Course',
          tvet: 'TVET Programme',
          other: 'Qualification'
        };
        return labels[String(value || '').toLowerCase()] || normalizeText(value, 'Qualification');
      };

      const drawDemandTag = (label, demand, x, y) => {
        if (!label) return;
        const color = DEMAND_PDF_COLORS[demand] || '#6b7280';
        doc.font('Helvetica-Bold').fontSize(7.5);
        const width = doc.widthOfString(label) + 12;
        doc.rect(x, y, width, 14).strokeColor(border).lineWidth(0.5).stroke();
        doc.fillColor(color).text(label, x + 6, y + 4);
      };

      const drawLetterhead = (title, subtitle = '') => {
        doc.font('Helvetica-Bold').fontSize(18).fillColor(text);
        doc.text('GOVERNMENT OF ESWATINI', leftMargin, 30, { width: pageWidth, align: 'center' });
        if (logoPath) {
          try { doc.image(logoPath, (doc.page.width - 46) / 2, 48, { width: 46 }); } catch (_) {}
        }
        doc.font('Helvetica-Bold').fontSize(8).fillColor(text);
        doc.text('Tel:  +268 4041971/2/3', leftMargin, 96);
        doc.text('Fax: +268 4049889', leftMargin, 108);
        doc.text('Email: mkhaliphi@gov.sz', leftMargin, 120);
        doc.text('Principal Secretary\'s Office', leftMargin, 96, { width: pageWidth, align: 'right' });
        doc.font('Helvetica').fontSize(8);
        doc.text('Ministry of Labour & Social Security', leftMargin, 108, { width: pageWidth, align: 'right' });
        doc.text('P.O. Box 198, Mbabane H100', leftMargin, 120, { width: pageWidth, align: 'right' });
        doc.moveTo(leftMargin, 136).lineTo(leftMargin + pageWidth, 136).strokeColor('#000000').lineWidth(0.7).stroke();
        doc.font('Helvetica-Bold').fontSize(12).fillColor(text)
          .text(title, leftMargin, 146, { width: pageWidth, align: 'center' });
        doc.font('Helvetica').fontSize(7.5).fillColor(muted);
        const subtitleLine = subtitle ? `${subtitle} - Generated: ${generatedDateStr}` : `Generated: ${generatedDateStr}`;
        doc.text(subtitleLine, leftMargin, 160, { width: pageWidth, align: 'center' });
        doc.moveTo(leftMargin, 170).lineTo(leftMargin + pageWidth, 170).strokeColor(border).lineWidth(0.6).stroke();
        return 178;
      };

      let pageContext = {
        title: 'CAREER ASSESSMENT REPORT',
        subtitle: 'Detailed personalized results'
      };
      let cursorY = drawLetterhead(pageContext.title, pageContext.subtitle);

      const startPage = (title, subtitle) => {
        pageContext = { title, subtitle };
        doc.addPage();
        cursorY = drawLetterhead(title, subtitle);
      };

      const ensureSpace = (neededHeight) => {
        if (cursorY + neededHeight > bottomY) {
          startPage(pageContext.title, pageContext.subtitle);
        }
      };

      const sectionHeading = (title, subtitle = '') => {
        ensureSpace(subtitle ? 34 : 24);
        doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(11)
          .text(title, leftMargin, cursorY);
        cursorY += 14;
        doc.moveTo(leftMargin, cursorY).lineTo(leftMargin + pageWidth, cursorY)
          .strokeColor('#e5e7eb').lineWidth(0.6).stroke();
        cursorY += 8;
        if (subtitle) {
          doc.fillColor(muted).font('Helvetica').fontSize(8.2)
            .text(subtitle, leftMargin, cursorY, { width: pageWidth });
          cursorY += 14;
        }
      };

      const drawProfileField = (label, value, x, y, width) => {
        doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(8.2)
          .text(`${label}:`, x, y, { width: 58 });
        doc.fillColor(text).font('Helvetica').fontSize(8.2)
          .text(normalizeText(value), x + 58, y, { width: Math.max(40, width - 58), ellipsis: true });
      };

      // Page 1 - Profile summary
      ensureSpace(92);
      const profileBoxY = cursorY;
      doc.rect(leftMargin, profileBoxY, pageWidth, 86).strokeColor(border).lineWidth(0.8).stroke();
      drawProfileField('Name', studentName, leftMargin + 12, profileBoxY + 10, 235);
      drawProfileField('Email', student.email, leftMargin + 12, profileBoxY + 26, 235);
      drawProfileField('User Type', student.userType, leftMargin + 12, profileBoxY + 42, 235);
      drawProfileField('Completed', completedDate, leftMargin + 272, profileBoxY + 10, 215);
      drawProfileField('Grade', student.gradeLevel, leftMargin + 272, profileBoxY + 26, 215);
      drawProfileField('Report ID', assessment.id, leftMargin + 272, profileBoxY + 42, 215);

      doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(8.2)
        .text('Holland Code:', leftMargin + 12, profileBoxY + 61);
      let codeX = leftMargin + 80;
      hollandDisplayGroups.forEach((group) => {
        const codeGroupText = group.join('/');
        doc.font('Helvetica-Bold').fontSize(10);
        const codeWidth = Math.max(18, Math.ceil(doc.widthOfString(codeGroupText)) + 10);
        doc.rect(codeX, profileBoxY + 58, codeWidth, 18).strokeColor(border).lineWidth(0.6).stroke();
        doc.fillColor(text).font('Helvetica-Bold').fontSize(10);
        doc.text(codeGroupText, codeX, profileBoxY + 62, { width: codeWidth, align: 'center' });
        codeX += codeWidth + 4;
      });
      doc.fillColor(muted).font('Helvetica').fontSize(7.6)
        .text(hollandCodeLabelText, codeX + 2, profileBoxY + 63, { width: leftMargin + pageWidth - (codeX + 2) });
      cursorY += 96;

      sectionHeading('Profile Highlights', 'Key strengths from your RIASEC assessment.');
      ensureSpace(78);
      doc.rect(leftMargin, cursorY, pageWidth, 72).strokeColor(border).lineWidth(0.7).stroke();
      doc.fillColor(text).font('Helvetica-Bold').fontSize(9.3)
        .text(`Primary code: ${hollandCodeDisplayText || hollandCode || 'Not generated'}`, leftMargin + 12, cursorY + 9, { width: pageWidth - 24 });
      topRankGroups.forEach((group, index) => {
        const scoreValue = Number(group[0]?.score || 0);
        const pct = totalScore > 0 ? Math.round((scoreValue / totalScore) * 100) : 0;
        const groupLabels = group.map((row) => row.label).join('/');
        const groupKeys = group.map((row) => row.key).join('/');
        doc.fillColor(muted).font('Helvetica').fontSize(8.2)
          .text(`${index + 1}. ${groupLabels} (${groupKeys}) - score ${scoreValue} (${pct}% of total profile score)`, leftMargin + 12, cursorY + 25 + index * 13, { width: pageWidth - 24 });
      });
      cursorY += 84;

      sectionHeading('RIASEC Score Profile', 'Visual and numeric breakdown across all six dimensions.');
      ensureSpace(230);
      const chartTop = cursorY;
      const radarCenterX = leftMargin + 130;
      const radarCenterY = chartTop + 98;
      const radarRadius = 74;
      const axes = ['R', 'I', 'A', 'S', 'E', 'C'];
      const angles = axes.map((_, i) => ((i * 60) - 90) * Math.PI / 180);

      for (let level = 1; level <= 3; level += 1) {
        const r = (level / 3) * radarRadius;
        const points = angles.map((angle) => [radarCenterX + r * Math.cos(angle), radarCenterY + r * Math.sin(angle)]);
        doc.moveTo(points[0][0], points[0][1]);
        points.slice(1).forEach((point) => doc.lineTo(point[0], point[1]));
        doc.closePath().strokeColor(lightTrack).lineWidth(0.5).stroke();
      }
      angles.forEach((angle) => {
        doc.moveTo(radarCenterX, radarCenterY)
          .lineTo(radarCenterX + radarRadius * Math.cos(angle), radarCenterY + radarRadius * Math.sin(angle))
          .strokeColor(lightTrack).lineWidth(0.5).stroke();
      });

      const profilePoints = axes.map((key, i) => {
        const r = (Number(scores[key] || 0) / maxScore) * radarRadius;
        return [radarCenterX + r * Math.cos(angles[i]), radarCenterY + r * Math.sin(angles[i])];
      });
      doc.moveTo(profilePoints[0][0], profilePoints[0][1]);
      profilePoints.slice(1).forEach((point) => doc.lineTo(point[0], point[1]));
      doc.closePath().fillColor(govBlue).fillOpacity(0.2).fill();
      doc.fillOpacity(1);
      doc.moveTo(profilePoints[0][0], profilePoints[0][1]);
      profilePoints.slice(1).forEach((point) => doc.lineTo(point[0], point[1]));
      doc.closePath().strokeColor(govBlue).lineWidth(2).stroke();

      axes.forEach((key, i) => {
        const valueRadius = (Number(scores[key] || 0) / maxScore) * radarRadius;
        const dotX = radarCenterX + valueRadius * Math.cos(angles[i]);
        const dotY = radarCenterY + valueRadius * Math.sin(angles[i]);
        doc.circle(dotX, dotY, 3).fillColor(RIASEC_COLORS[key]).fill();
        const labelRadius = radarRadius + 14;
        doc.fillColor(RIASEC_COLORS[key]).font('Helvetica-Bold').fontSize(9)
          .text(key, radarCenterX + labelRadius * Math.cos(angles[i]) - 4, radarCenterY + labelRadius * Math.sin(angles[i]) - 5, { width: 10 });
      });

      const breakdownX = leftMargin + 280;
      const barTrackWidth = 86;
      doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(9.2)
        .text('Score Breakdown', breakdownX, chartTop + 10, { width: pageWidth - (breakdownX - leftMargin) });
      scoreRows.forEach((row, index) => {
        const rowY = chartTop + 28 + index * 30;
        doc.rect(breakdownX, rowY, 16, 16).strokeColor(border).lineWidth(0.6).stroke();
        doc.fillColor(text).font('Helvetica-Bold').fontSize(8).text(row.key, breakdownX + 4, rowY + 3);
        doc.fillColor('#374151').font('Helvetica').fontSize(8.2)
          .text(row.label, breakdownX + 22, rowY + 4, { width: 86, ellipsis: true });

        const barX = breakdownX + 112;
        doc.rect(barX, rowY + 4, barTrackWidth, 7).fillColor(lightTrack).fill();
        const filledBar = Math.max(0, Math.round((row.score / maxScore) * barTrackWidth));
        if (filledBar > 0) {
          doc.rect(barX, rowY + 4, filledBar, 7).fillColor(row.color).fill();
        }
        doc.fillColor(row.color).font('Helvetica-Bold').fontSize(8.6)
          .text(String(row.score), barX + barTrackWidth + 8, rowY + 3, { width: 24, align: 'right' });
      });
      cursorY = chartTop + 220;

      sectionHeading('Your Top Holland Code Interpretation', 'Top five profile themes at a glance.');
      const interpretationCardGap = 8;
      const interpretationCardWidth = Math.floor((pageWidth - (interpretationCardGap * 4)) / 5);
      const interpretationCardHeight = 80;
      ensureSpace(interpretationCardHeight + 8);
      topFive.forEach((row, index) => {
        const cardX = leftMargin + (index * (interpretationCardWidth + interpretationCardGap));
        const rawSummary = (RIASEC_DESC[row.key] || 'Interpretation not available').split('.')[0].trim();
        const summary = rawSummary.length > 54 ? `${rawSummary.slice(0, 51)}...` : rawSummary;
        const scorePct = totalScore > 0 ? Math.round((row.score / totalScore) * 100) : 0;

        doc.rect(cardX, cursorY, interpretationCardWidth, interpretationCardHeight).strokeColor(border).lineWidth(0.6).stroke();
        doc.rect(cardX, cursorY, interpretationCardWidth, 4).fillColor(row.color).fill();
        doc.fillColor(row.color).font('Helvetica-Bold').fontSize(7.3)
          .text(`#${index + 1}`, cardX + 6, cursorY + 9, { width: 24 });
        doc.fillColor(text).font('Helvetica-Bold').fontSize(9.6)
          .text(row.key, cardX + interpretationCardWidth - 16, cursorY + 9, { width: 10, align: 'right' });
        doc.fillColor(text).font('Helvetica-Bold').fontSize(7.8)
          .text(row.label, cardX + 6, cursorY + 24, { width: interpretationCardWidth - 12, ellipsis: true });
        doc.fillColor(muted).font('Helvetica').fontSize(7.1)
          .text(`${row.score} points | ${scorePct}%`, cardX + 6, cursorY + 37, { width: interpretationCardWidth - 12, ellipsis: true });
        doc.fillColor('#374151').font('Helvetica').fontSize(6.8)
          .text(summary, cardX + 6, cursorY + 50, { width: interpretationCardWidth - 12, height: 32, ellipsis: true });
      });
      cursorY += interpretationCardHeight + 8;

      // Page 2 - Occupations
      startPage('RECOMMENDED CAREER PATHS', 'Careers aligned with your profile and local demand indicators.');
      if (occupations.length === 0) {
        ensureSpace(42);
        doc.rect(leftMargin, cursorY, pageWidth, 38).strokeColor(border).lineWidth(0.6).stroke();
        doc.fillColor(muted).font('Helvetica').fontSize(8.4)
          .text('No occupations are currently mapped for this profile. Please consult a counselor for guided planning.', leftMargin + 10, cursorY + 12, { width: pageWidth - 20 });
        cursorY += 46;
      } else {
        occupations.slice(0, 12).forEach((occupation) => {
          const dominantLetter = occupation.primaryRiasec || hollandLetters[0] || 'R';
          const demand = occupation.localDemand || occupation.demandLevel;
          const demandLabel = demand ? (DEMAND_LABELS[demand] || demand) : null;
          const categoryLabel = normalizeText(occupation.category, 'General');
          const matchLine = `Why this matches you: ${topThree.map((row) => row.label).join(', ')} tendencies are present in this path.`;
          const description = normalizeText(occupation.description, 'No occupation description available yet.');
          const descriptionHeight = Math.min(58, measureText(description, pageWidth - 22, 'Helvetica', 8.1));
          const blockHeight = 64 + descriptionHeight;
          ensureSpace(blockHeight + 10);

          doc.rect(leftMargin, cursorY, pageWidth, blockHeight).strokeColor(border).lineWidth(0.6).stroke();
          doc.rect(leftMargin + 10, cursorY + 10, 18, 18).strokeColor(border).lineWidth(0.6).stroke();
          doc.fillColor(text).font('Helvetica-Bold').fontSize(9).text(dominantLetter, leftMargin + 15, cursorY + 14);

          if (demandLabel) {
            const demandTagX = leftMargin + pageWidth - (doc.widthOfString(demandLabel) + 20);
            drawDemandTag(demandLabel, demand, demandTagX, cursorY + 11);
          }

          doc.fillColor(text).font('Helvetica-Bold').fontSize(9.6)
            .text(normalizeText(occupation.name, 'Occupation'), leftMargin + 34, cursorY + 10, { width: pageWidth - 170, ellipsis: true });
          doc.fillColor(muted).font('Helvetica').fontSize(8.2)
            .text(`Category: ${categoryLabel}`, leftMargin + 34, cursorY + 23, { width: pageWidth - 170, ellipsis: true });
          doc.fillColor('#374151').font('Helvetica-Bold').fontSize(8.1)
            .text(matchLine, leftMargin + 10, cursorY + 35, { width: pageWidth - 20 });
          doc.fillColor(muted).font('Helvetica').fontSize(8.1)
            .text(description, leftMargin + 10, cursorY + 48, { width: pageWidth - 20 });

          cursorY += blockHeight + 10;
        });
      }

      // Page 3 - Courses and qualifications
      startPage('RECOMMENDED COURSES AND QUALIFICATIONS', 'Study pathways, entry requirements, and institutions.');
      if (courses.length === 0) {
        ensureSpace(42);
        doc.rect(leftMargin, cursorY, pageWidth, 38).strokeColor(border).lineWidth(0.6).stroke();
        doc.fillColor(muted).font('Helvetica').fontSize(8.4)
          .text('No courses are currently linked to this profile. Career counseling can help identify suitable pathways.', leftMargin + 10, cursorY + 12, { width: pageWidth - 20 });
        cursorY += 46;
      } else {
        courses.slice(0, 12).forEach((course) => {
          const qualification = formatQualification(course.qualificationType);
          const durationText = course.durationYears ? `${course.durationYears} years` : 'Duration varies';
          const fieldText = normalizeText(course.fieldOfStudy, 'Field not specified');
          const riasecText = Array.isArray(course.riasecCodes) && course.riasecCodes.length > 0
            ? course.riasecCodes.join(', ')
            : 'Not tagged';
          const description = normalizeText(course.description, 'No course summary provided.');
          const requirements = (course.requirements || []).slice(0, 6).map((requirement) => {
            const suffix = requirement.isMandatory === false ? 'recommended' : 'required';
            return `${normalizeText(requirement.subject)} (${normalizeText(requirement.minimumGrade)} - ${suffix})`;
          });
          const institutions = (course.courseInstitutions || [])
            .map((entry) => entry.institution?.name)
            .filter(Boolean)
            .slice(0, 6);

          const metaText = `Duration: ${durationText}   |   Field: ${fieldText}   |   RIASEC: ${riasecText}`;
          const requirementsText = requirements.length > 0
            ? requirements.map((item) => `- ${item}`).join('\n')
            : 'Entry requirements should be confirmed with the institution.';
          const institutionsText = institutions.length > 0
            ? institutions.map((name) => `- ${name}`).join('\n')
            : 'Institution links are not available for this course yet.';
          const fullTextWidth = pageWidth - 20;
          const detailTextWidth = pageWidth - 126;
          const metaHeight = measureText(metaText, fullTextWidth, 'Helvetica', 8.1, { lineGap: 1 });
          const descriptionHeight = measureText(description, fullTextWidth, 'Helvetica', 8.1, { lineGap: 1 });
          const requirementsHeight = measureText(requirementsText, detailTextWidth, 'Helvetica', 7.9, { lineGap: 1 });
          const institutionsHeight = measureText(institutionsText, detailTextWidth, 'Helvetica', 7.9, { lineGap: 1 });

          const blockHeight = 72 + metaHeight + descriptionHeight + requirementsHeight + institutionsHeight + 14;
          ensureSpace(blockHeight + 10);

          doc.rect(leftMargin, cursorY, pageWidth, blockHeight).strokeColor(border).lineWidth(0.6).stroke();

          doc.font('Helvetica-Bold').fontSize(7.2);
          const qualTagWidth = doc.widthOfString(qualification.toUpperCase()) + 14;
          doc.rect(leftMargin + 10, cursorY + 10, qualTagWidth, 14).strokeColor(border).lineWidth(0.5).stroke();
          doc.fillColor(text).text(qualification.toUpperCase(), leftMargin + 17, cursorY + 14, { width: qualTagWidth - 8, align: 'center' });

          if (course.fundingPriority) {
            drawDemandTag('SLAS Priority', 'high', leftMargin + pageWidth - 86, cursorY + 10);
          }

          doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(9.6)
            .text(normalizeText(course.name, 'Course'), leftMargin + qualTagWidth + 16, cursorY + 11, { width: pageWidth - qualTagWidth - 110, ellipsis: true });

          doc.fillColor(muted).font('Helvetica').fontSize(8.1)
            .text(metaText, leftMargin + 10, cursorY + 30, { width: fullTextWidth, lineGap: 1 });

          let blockY = cursorY + 30 + metaHeight + 4;
          doc.fillColor('#374151').font('Helvetica').fontSize(8.1)
            .text(description, leftMargin + 10, blockY, { width: fullTextWidth, lineGap: 1 });
          blockY += descriptionHeight + 6;

          doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(8)
            .text('Entry requirements:', leftMargin + 10, blockY, { width: 110 });
          doc.fillColor(text).font('Helvetica').fontSize(7.9)
            .text(requirementsText, leftMargin + 116, blockY, { width: detailTextWidth, lineGap: 1 });
          blockY += requirementsHeight + 6;

          doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(8)
            .text('Institutions:', leftMargin + 10, blockY, { width: 110 });
          doc.fillColor(text).font('Helvetica').fontSize(7.9)
            .text(institutionsText, leftMargin + 116, blockY, { width: detailTextWidth, lineGap: 1 });

          cursorY += blockHeight + 10;
        });
      }

      // Page 4 - Subjects, funding, and next steps
      startPage('NEXT STEPS AND SUPPORT', 'Actionable guidance after your assessment.');

      sectionHeading('Suggested School Subjects', 'Subjects that support your profile and career direction.');
      if (subjects.length === 0) {
        ensureSpace(22);
        doc.fillColor(muted).font('Helvetica').fontSize(8.2)
          .text('No subject recommendations are currently available for this profile.', leftMargin, cursorY, { width: pageWidth });
        cursorY += 20;
      } else {
        ensureSpace(56);
        let pillX = leftMargin;
        let pillY = cursorY;
        doc.font('Helvetica-Bold').fontSize(7.9);
        subjects.slice(0, 16).forEach((subject) => {
          const label = normalizeText(subject);
          const width = doc.widthOfString(label) + 16;
          if (pillX + width > leftMargin + pageWidth) {
            pillX = leftMargin;
            pillY += 18;
          }
          if (pillY + 18 > bottomY) {
            cursorY = pillY;
            startPage(pageContext.title, pageContext.subtitle);
            sectionHeading('Suggested School Subjects', 'Subjects that support your profile and career direction.');
            pillX = leftMargin;
            pillY = cursorY;
          }
          doc.rect(pillX, pillY, width, 14).strokeColor(border).lineWidth(0.5).stroke();
          doc.fillColor(text).font('Helvetica-Bold').fontSize(7.8).text(label, pillX + 8, pillY + 4, { width: width - 8 });
          pillX += width + 6;
        });
        cursorY = pillY + 20;
      }

      sectionHeading('Government Funding Priority Alignment');
      if (!fundingAlignment) {
        ensureSpace(24);
        doc.fillColor(muted).font('Helvetica').fontSize(8.2)
          .text('Funding alignment analysis is not available for this result.', leftMargin, cursorY, { width: pageWidth });
        cursorY += 20;
      } else {
        ensureSpace(84);
        doc.rect(leftMargin, cursorY, pageWidth, 78).strokeColor(border).lineWidth(0.6).stroke();
        const alignment = normalizeText(fundingAlignment.overall, 'LOW').toUpperCase();
        const alignmentColor = alignment === 'HIGH' ? '#166534' : alignment === 'MEDIUM' ? '#92400e' : '#991b1b';
        doc.fillColor(alignmentColor).font('Helvetica-Bold').fontSize(11)
          .text(`Overall alignment: ${alignment}`, leftMargin + 12, cursorY + 10, { width: pageWidth - 24 });
        doc.fillColor(muted).font('Helvetica').fontSize(8.1)
          .text(
            `${fundingAlignment.priorityFieldCount || 0} priority field(s) matched, ${fundingAlignment.nonPriorityFieldCount || 0} non-priority field(s).`,
            leftMargin + 12,
            cursorY + 28,
            { width: pageWidth - 24 }
          );
        const interpretation = normalizeText(fundingAlignment.interpretation, 'No interpretation available.');
        doc.fillColor(text).font('Helvetica').fontSize(8.1)
          .text(interpretation, leftMargin + 12, cursorY + 42, { width: pageWidth - 24 });
        cursorY += 86;

        const alignedFields = (fundingAlignment.fields || []).slice(0, 6);
        if (alignedFields.length > 0) {
          ensureSpace(26 + alignedFields.length * 16);
          doc.fillColor(govBlue).font('Helvetica-Bold').fontSize(8.4)
            .text('Priority fields identified:', leftMargin, cursorY, { width: pageWidth });
          cursorY += 14;
          alignedFields.forEach((field, index) => {
            doc.fillColor(text).font('Helvetica').fontSize(8.1)
              .text(`${index + 1}. ${normalizeText(field.field)} (${normalizeText(field.alignment, 'LOW')})`, leftMargin + 6, cursorY, { width: pageWidth - 12 });
            cursorY += 14;
          });
          cursorY += 2;
        }
      }

      sectionHeading('Recommended Next Steps', 'Use these steps to turn your results into a clear plan.');
      const nextSteps = [
        `Review your top profile areas: ${topThree.map((row) => `${row.label} (${row.key})`).join(', ')}.`,
        subjects.length > 0
          ? `Prioritize these subjects in your learning plan: ${subjects.slice(0, 5).join(', ')}.`
          : 'Ask your counselor for subject combinations that support your target career paths.',
        occupations.length > 0
          ? `Research your top career options: ${occupations.slice(0, 3).map((occ) => normalizeText(occ.name)).join(', ')}.`
          : 'Research occupation options related to your Holland profile with a counselor.',
        courses.length > 0
          ? 'Compare course entry requirements and institutions before applying.'
          : 'Compile qualification pathways from accredited institutions and review entry requirements.',
        'Book a counselor session to validate your final study and career action plan.'
      ];
      nextSteps.forEach((step, index) => {
        const stepHeight = measureText(step, pageWidth - 28, 'Helvetica', 8.2);
        ensureSpace(stepHeight + 8);
        doc.fillColor(text).font('Helvetica-Bold').fontSize(8.2)
          .text(`${index + 1}.`, leftMargin, cursorY, { width: 14 });
        doc.fillColor(text).font('Helvetica').fontSize(8.2)
          .text(step, leftMargin + 14, cursorY, { width: pageWidth - 14 });
        cursorY += stepHeight + 6;
      });

      ensureSpace(42);
      doc.rect(leftMargin, cursorY + 4, pageWidth, 34).strokeColor(border).lineWidth(0.5).stroke();
      doc.fillColor(muted).font('Helvetica').fontSize(7.6)
        .text(
          'This SDS report is guidance material and should be used with counselor support, institution prospectuses, and updated labor market information before final decisions are made.',
          leftMargin + 8,
          cursorY + 14,
          { width: pageWidth - 16 }
        );

      const pages = doc.bufferedPageRange();
      for (let pageIndex = 0; pageIndex < pages.count; pageIndex += 1) {
        doc.switchToPage(pageIndex);
        doc.font('Helvetica').fontSize(8).fillColor(muted)
          .text(`Page ${pageIndex + 1} of ${pages.count}`, leftMargin, doc.page.height - 28, { width: pageWidth, align: 'right' });
      }

      doc.end();
    } catch (error) {
      logger.error({ actionType: 'PDF_GENERATION_FAILED', message: `PDF generation failed for assessment ${req.params.assessmentId}`, req, details: { error: error.message, stack: error.stack } });
      return next(error);
    }
  }
}

module.exports = new AssessmentController();

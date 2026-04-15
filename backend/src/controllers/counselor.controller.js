const counselorService = require('../services/counselor.service');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

const getMyStudents = async (req, res, next) => {
  try {
    const { formatted, actor, institutionId } = await counselorService.getMyStudents(req.user.id, req.query.institutionId);
    logger.info({ actionType: 'COUNSELOR_STUDENTS_FETCHED', message: `${actor.role} ${actor.id} fetched ${formatted.length} students`, req, details: { actorId: actor.id, institutionId } });
    return res.status(200).json({ status: 'success', data: { students: formatted } });
  } catch (error) {
    logger.error({ actionType: 'COUNSELOR_STUDENTS_FAILED', message: 'Failed to fetch students', req, details: { error: error.message, stack: error.stack } });
    return next(error);
  }
};

const getInstitutionStats = async (req, res, next) => {
  try {
    const { stats, hollandDistribution, actor } = await counselorService.getInstitutionStats(req.user.id, req.query.institutionId);
    if (!stats) return res.status(200).json({ status: 'success', data: { stats: null } });
    logger.info({ actionType: 'COUNSELOR_INSTITUTION_STATS', message: `Fetched institution stats for ${actor.role} ${actor.id}`, req, details: { actorId: actor.id } });
    return res.status(200).json({ status: 'success', data: { stats, hollandDistribution } });
  } catch (error) {
    logger.error({ actionType: 'COUNSELOR_INSTITUTION_STATS_FAILED', message: 'Failed to fetch institution stats', req, details: { error: error.message, stack: error.stack } });
    return next(error);
  }
};

const importStudents = async (req, res, next) => {
  try {
    const queryInstitutionId = req.query.institutionId || req.body?.institutionId;
    const { importReport, actor, institutionId } = await counselorService.importStudents(req.user.id, req.body, queryInstitutionId);
    logger.info({ actionType: 'COUNSELOR_STUDENTS_IMPORTED', message: `${actor.role} ${actor.id} imported ${importReport.importedCount} students`, req, details: { actorId: actor.id, institutionId, count: importReport.importedCount } });
    return res.status(201).json({ status: 'success', data: { importReport } });
  } catch (error) {
    logger.error({ actionType: 'COUNSELOR_STUDENTS_IMPORT_FAILED', message: 'Failed to import students', req, details: { error: error.message, stack: error.stack } });
    return next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    await counselorService.deleteStudent(req.user.id, req.user.role, req.user.institutionId, req.params.studentId);
    logger.info({ actionType: 'STUDENT_DELETED', message: `Student ${req.params.studentId} deleted by ${req.user.role} ${req.user.id}`, req });
    return res.status(200).json({ status: 'success', message: 'Student deleted' });
  } catch (error) {
    logger.error({ actionType: 'STUDENT_DELETE_FAILED', message: 'Failed to delete student', req, details: { error: error.message } });
    return next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const updated = await counselorService.updateStudent(req.user.role, req.user.institutionId, req.params.studentId, req.body);
    return res.status(200).json({ status: 'success', data: { student: updated } });
  } catch (error) {
    logger.error({ actionType: 'STUDENT_UPDATE_FAILED', message: 'Failed to update student', req, details: { error: error.message } });
    return next(error);
  }
};

const getStudentResults = async (req, res, next) => {
  try {
    const { student, assessments, recommendations } = await counselorService.getStudentResults(req.user.role, req.user.institutionId, req.params.studentId);
    return res.status(200).json({
      status: 'success',
      data: { student: { id: student.id, firstName: student.firstName, lastName: student.lastName, email: student.email }, assessments, recommendations }
    });
  } catch (error) {
    logger.error({ actionType: 'STUDENT_RESULTS_FAILED', message: 'Failed to get student results', req, details: { error: error.message } });
    return next(error);
  }
};

/**
 * Generate a bulk PDF of printable login cards for an institution's students.
 * Optionally filter by grade/class. Marks cards as printed.
 * GET /counselor/login-cards?institutionId=&grade=&class=
 */
const generateLoginCards = async (req, res, next) => {
  try {
    const { students, institution, actor } = await counselorService.getLoginCardsData(
      req.user.id, req.user.role, req.user.institutionId, req.query.institutionId, req.query.grade
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="LoginCards_${institution.name.replace(/\s+/g, '_')}.pdf"`);
    doc.pipe(res);

    const CARD_W = 240;
    const CARD_H = 160;
    const COLS = 2;
    const GAP_X = 20;
    const GAP_Y = 15;
    const PAGE_W = 595;
    const PAGE_H = 842;
    const MARGIN = 40;

    let col = 0;
    let row = 0;
    const cardsPerPage = Math.floor((PAGE_H - MARGIN * 2 + GAP_Y) / (CARD_H + GAP_Y)) * COLS;

    students.forEach((student, idx) => {
      if (idx > 0 && idx % cardsPerPage === 0) {
        doc.addPage();
        col = 0;
        row = 0;
      }

      const x = MARGIN + col * (CARD_W + GAP_X);
      const y = MARGIN + row * (CARD_H + GAP_Y);
      const loginNumber = student.studentCode || student.username || '';
      const studentNum = student.schoolStudent?.studentNumber || student.studentNumber || '';
      const grade = student.schoolStudent?.grade || student.gradeLevel || '';
      const className = student.schoolStudent?.className || student.className || '';

      // Card border
      doc.rect(x, y, CARD_W, CARD_H).lineWidth(1).stroke('#2D8BC4');

      // Header bar
      doc.rect(x, y, CARD_W, 28).fillColor('#2D8BC4').fill();
      doc.fontSize(7).fillColor('#ffffff').text('ESWATINI CAREER GUIDANCE SYSTEM', x + 5, y + 5, { width: CARD_W - 10, align: 'center' });
      doc.fontSize(6).fillColor('#c7d2fe').text('careers.gov.sz', x + 5, y + 16, { width: CARD_W - 10, align: 'center' });

      // Student name
      doc.fontSize(9).fillColor('#111827').text(
        `${student.firstName} ${student.lastName}`,
        x + 8, y + 34,
        { width: CARD_W - 16, align: 'left' }
      );
      if (grade || className) {
        doc.fontSize(7).fillColor('#6b7280').text(
          `${grade}${className ? ' • Class ' + className : ''}`,
          x + 8, y + 46,
          { width: CARD_W - 16 }
        );
      }

      // Divider
      doc.moveTo(x + 8, y + 58).lineTo(x + CARD_W - 8, y + 58).stroke('#e5e7eb');

      // Login details
      doc.fontSize(7).fillColor('#374151').text('LOGIN DETAILS', x + 8, y + 63);
      doc.fontSize(9).fillColor('#111827').font('Helvetica-Bold')
        .text(`Login Number: ${loginNumber}`, x + 8, y + 73);
      doc.font('Helvetica').fontSize(8).fillColor('#111827')
        .text(`Website:  careers.gov.sz`, x + 8, y + 86);

      // Instructions
      doc.fontSize(6).fillColor('#6b7280')
        .text('1. Go to website and click Login', x + 8, y + 99)
        .text('2. Enter your Login Number above', x + 8, y + 107)
        .text('3. Use your printed password card', x + 8, y + 115)
        .text('4. Complete the Career Test', x + 8, y + 123)
        .text('5. Download your Career Report', x + 8, y + 131);

      // Login number barcode-style display
      doc.fontSize(6).fillColor('#9ca3af').text(`ID: ${loginNumber}`, x + 8, y + CARD_H - 14, { width: CARD_W - 16, align: 'right' });

      col += 1;
      if (col >= COLS) {
        col = 0;
        row += 1;
      }
    });

    doc.end();

    counselorService.markLoginCardsPrinted(students);

    logger.info({ actionType: 'LOGIN_CARDS_GENERATED', message: `${actor.role} ${actor.id} generated ${students.length} login cards for institution ${institution.id}`, req, details: { actorId: actor.id, institutionId: institution.id, count: students.length } });

  } catch (error) {
    logger.error({ actionType: 'LOGIN_CARDS_FAILED', message: 'Failed to generate login cards', req, details: { error: error.message } });
    return next(error);
  }
};

module.exports = {
  getMyStudents,
  getInstitutionStats,
  importStudents,
  deleteStudent,
  updateStudent,
  getStudentResults,
  generateLoginCards
};

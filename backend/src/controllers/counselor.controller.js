const { User, Assessment, Institution, SchoolStudent } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { bulkCreateStudents } = require('../services/studentImport.service');
const scoringService = require('../services/scoring.service');
const PDFDocument = require('pdfkit');

/**
 * Counselor Controller
 * Admin can access all features. Counselor is scoped to their institution.
 */

const resolveInstitutionId = (actor, queryParam) => {
  if (actor.role === 'System Administrator') return queryParam || null;
  return actor.institutionId || null;
};

const getMyStudents = async (req, res, next) => {
  try {
    const actor = await User.findByPk(req.user.id);
    const institutionId = resolveInstitutionId(actor, req.query.institutionId);

    const where = { role: 'Test Taker' };
    if (institutionId) where.institutionId = institutionId;

    const students = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email', 'gradeLevel', 'institutionId', 'createdAt'],
      include: [
        {
          model: Assessment,
          as: 'assessments',
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'status', 'progress', 'hollandCode', 'createdAt', 'completedAt',
            'scoreR', 'scoreI', 'scoreA', 'scoreS', 'scoreE', 'scoreC']
        },
        { model: Institution, as: 'institution', attributes: ['id', 'name'] }
      ],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    const formatted = students.map((student) => {
      const latestAssessment = student.assessments?.[0] || null;
      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        gradeLevel: student.gradeLevel,
        institutionId: student.institutionId,
        institutionName: student.institution?.name || null,
        createdAt: student.createdAt,
        latestAssessment: latestAssessment ? {
          id: latestAssessment.id,
          status: latestAssessment.status,
          progress: Number(latestAssessment.progress),
          hollandCode: latestAssessment.hollandCode,
          createdAt: latestAssessment.createdAt,
          completedAt: latestAssessment.completedAt,
          scoreR: latestAssessment.scoreR,
          scoreI: latestAssessment.scoreI,
          scoreA: latestAssessment.scoreA,
          scoreS: latestAssessment.scoreS,
          scoreE: latestAssessment.scoreE,
          scoreC: latestAssessment.scoreC
        } : null
      };
    });

    logger.info({
      actionType: 'COUNSELOR_STUDENTS_FETCHED',
      message: `${actor.role} ${actor.id} fetched ${formatted.length} students`,
      req,
      details: { actorId: actor.id, institutionId }
    });

    return res.status(200).json({ status: 'success', data: { students: formatted } });
  } catch (error) {
    logger.error({
      actionType: 'COUNSELOR_STUDENTS_FAILED',
      message: 'Failed to fetch students',
      req,
      details: { error: error.message, stack: error.stack }
    });
    return next(error);
  }
};

const getInstitutionStats = async (req, res, next) => {
  try {
    const actor = await User.findByPk(req.user.id);
    const institutionId = resolveInstitutionId(actor, req.query.institutionId);

    if (!institutionId) {
      return res.status(200).json({ status: 'success', data: { stats: null } });
    }

    const studentWhere = { institutionId, role: 'Test Taker' };
    const totalStudents = await User.count({ where: studentWhere });
    const studentsWithAssessments = await User.count({
      where: studentWhere,
      include: [{ model: Assessment, as: 'assessments', required: true }]
    });

    const stats = await Assessment.findOne({
      where: { status: 'completed' },
      attributes: [
        [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'completedCount'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_r')), 'avgR'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_i')), 'avgI'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_a')), 'avgA'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_s')), 'avgS'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_e')), 'avgE'],
        [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_c')), 'avgC']
      ],
      include: [{
        model: User, as: 'user', required: true, attributes: [],
        where: { institutionId }
      }],
      raw: true
    });

    const hollandDist = await Assessment.findAll({
      where: { status: 'completed', hollandCode: { [Op.ne]: null } },
      attributes: [
        'hollandCode',
        [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'count']
      ],
      include: [{
        model: User, as: 'user', required: true, attributes: [],
        where: { institutionId }
      }],
      group: ['hollandCode'],
      raw: true
    });

    logger.info({
      actionType: 'COUNSELOR_INSTITUTION_STATS',
      message: `Fetched institution stats for ${actor.role} ${actor.id}`,
      req,
      details: { actorId: actor.id, institutionId }
    });

    return res.status(200).json({
      status: 'success',
      data: { stats: { ...stats, totalStudents, studentsWithAssessments }, hollandDistribution: hollandDist }
    });
  } catch (error) {
    logger.error({
      actionType: 'COUNSELOR_INSTITUTION_STATS_FAILED',
      message: 'Failed to fetch institution stats',
      req,
      details: { error: error.message, stack: error.stack }
    });
    return next(error);
  }
};

const importStudents = async (req, res, next) => {
  try {
    const actor = await User.findByPk(req.user.id);
    const institutionId = resolveInstitutionId(actor, req.query.institutionId || req.body?.institutionId);

    if (!req.body || typeof req.body !== 'string' || !req.body.trim()) {
      return res.status(400).json({ status: 'error', message: 'CSV data is required' });
    }

    if (!institutionId) {
      return res.status(400).json({ status: 'error', message: 'Institution is required' });
    }

    const credentials = await bulkCreateStudents(req.body, institutionId);

    logger.info({
      actionType: 'COUNSELOR_STUDENTS_IMPORTED',
      message: `${actor.role} ${actor.id} imported ${credentials.length} students`,
      req,
      details: { actorId: actor.id, institutionId, count: credentials.length }
    });

    return res.status(201).json({ status: 'success', data: { credentials } });
  } catch (error) {
    logger.error({
      actionType: 'COUNSELOR_STUDENTS_IMPORT_FAILED',
      message: 'Failed to import students',
      req,
      details: { error: error.message, stack: error.stack }
    });
    return next(error);
  }
};

const deleteStudent = async (req, res, next) => {
  try {
    const actor = await User.findByPk(req.user.id);
    const student = await User.findOne({ where: { id: req.params.studentId, role: 'Test Taker' } });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    if (actor.role === 'Test Administrator' && student.institutionId !== actor.institutionId) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to manage this student' });
    }

    await student.destroy();

    logger.info({
      actionType: 'STUDENT_DELETED',
      message: `Student ${req.params.studentId} deleted by ${actor.role} ${actor.id}`,
      req
    });

    return res.status(200).json({ status: 'success', message: 'Student deleted' });
  } catch (error) {
    logger.error({ actionType: 'STUDENT_DELETE_FAILED', message: 'Failed to delete student', req, details: { error: error.message } });
    return next(error);
  }
};

const updateStudent = async (req, res, next) => {
  try {
    const actor = await User.findByPk(req.user.id);
    const student = await User.findOne({ where: { id: req.params.studentId, role: 'Test Taker' } });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    if (actor.role === 'Test Administrator' && student.institutionId !== actor.institutionId) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to manage this student' });
    }

    const allowed = ['firstName', 'lastName', 'gradeLevel', 'email', 'institutionId'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    await student.update(updates);
    const updated = await User.findByPk(student.id, { attributes: { exclude: ['password', 'passwordResetToken', 'refreshToken'] } });

    return res.status(200).json({ status: 'success', data: { student: updated } });
  } catch (error) {
    logger.error({ actionType: 'STUDENT_UPDATE_FAILED', message: 'Failed to update student', req, details: { error: error.message } });
    return next(error);
  }
};

const getStudentResults = async (req, res, next) => {
  try {
    const actor = await User.findByPk(req.user.id);
    const student = await User.findOne({ where: { id: req.params.studentId, role: 'Test Taker' } });

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Student not found' });
    }

    if (actor.role === 'Test Administrator' && student.institutionId !== actor.institutionId) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to view this student' });
    }

    const assessments = await Assessment.findAll({
      where: { userId: student.id },
      order: [['createdAt', 'DESC']]
    });

    const completed = assessments.find((a) => a.status === 'completed');
    let recommendations = { occupations: [], courses: [], suggestedSubjects: [] };
    if (completed) {
      try {
        recommendations = await scoringService.getRecommendations(
          completed.hollandCode, completed.educationLevelAtTest
        );
      } catch (_) { recommendations = { occupations: [], courses: [], suggestedSubjects: [] }; }
    }

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
    const actor = await User.findByPk(req.user.id);
    const institutionId = resolveInstitutionId(actor, req.query.institutionId);

    if (!institutionId) {
      return res.status(400).json({ status: 'error', message: 'Institution is required' });
    }

    const institution = await Institution.findByPk(institutionId);
    if (!institution) {
      return res.status(404).json({ status: 'error', message: 'Institution not found' });
    }

    const where = { institutionId, role: 'Test Taker' };
    if (req.query.grade) {
      const gradeFilter = req.query.grade;
      where[Op.or] = [
        { gradeLevel: gradeFilter },
        { className: gradeFilter }
      ];
    }

    const students = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'username', 'gradeLevel', 'className', 'studentNumber', 'studentCode', 'createdAt'],
      include: [{
        model: SchoolStudent,
        as: 'schoolStudent',
        required: false,
        attributes: ['studentNumber', 'grade', 'className', 'loginCardPrinted']
      }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    if (students.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No students found for these criteria' });
    }

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
      doc.rect(x, y, CARD_W, CARD_H).lineWidth(1).stroke('#1e3a5f');

      // Header bar
      doc.rect(x, y, CARD_W, 28).fillColor('#1e3a5f').fill();
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

    // Mark cards as printed (fire-and-forget)
    const schoolStudentIds = students
      .map(s => s.schoolStudent?.id)
      .filter(Boolean);
    if (schoolStudentIds.length > 0) {
      SchoolStudent.update(
        { loginCardPrinted: true, loginCardPrintedAt: new Date() },
        { where: { id: schoolStudentIds } }
      ).catch(() => {});
    }

    logger.info({
      actionType: 'LOGIN_CARDS_GENERATED',
      message: `${actor.role} ${actor.id} generated ${students.length} login cards for institution ${institutionId}`,
      req,
      details: { actorId: actor.id, institutionId, count: students.length }
    });

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

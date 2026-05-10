'use strict';

const { User, Assessment, Institution, SchoolStudent } = require('../models');
const { Op } = require('sequelize');
const { bulkCreateStudents } = require('./studentImport.service');
const scoringService = require('./scoring.service');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors/appError');

const resolveInstitutionId = (actor, queryParam) => {
  if (!actor) {
    return null;
  }
  // System Administrators can scope to any institution explicitly.
  if (actor.role === 'System Administrator') {
    return queryParam || actor.institutionId || null;
  }
  // Test Administrators are always scoped to their assigned institution.
  return actor.institutionId || null;
};

const resolveScopedStudent = async (actorId, studentId) => {
  const actor = await User.findByPk(actorId);
  if (!actor) {
    throw new NotFoundError('Actor not found', 'ACTOR_NOT_FOUND');
  }
  const institutionId = resolveInstitutionId(actor, null);

  const where = { id: studentId, role: 'Test Taker' };
  if (actor.role !== 'System Administrator') {
    where.institutionId = institutionId;
  }

  const student = await User.findOne({ where });
  if (!student) {
    throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
  }

  return { student, actor, institutionId };
};

module.exports = {

  /* ─── Students ────────────────────────────────────────────────────────── */

  getMyStudents: async (actorId, queryInstitutionId) => {
    const actor = await User.findByPk(actorId);
    const institutionId = resolveInstitutionId(actor, queryInstitutionId);

    const where = { role: 'Test Taker' };
    if (institutionId) where.institutionId = institutionId;

    const students = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'email', 'gradeLevel', 'institutionId', 'createdAt'],
      include: [
        {
          model: Assessment, as: 'assessments', separate: true, limit: 1,
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
      const latestDisplayCode = latestAssessment
        ? scoringService.getAssessmentDisplayCode(latestAssessment, latestAssessment.hollandCode || null)
        : null;
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
          hollandCodeDisplay: latestDisplayCode,
          createdAt: latestAssessment.createdAt,
          completedAt: latestAssessment.completedAt,
          scoreR: latestAssessment.scoreR, scoreI: latestAssessment.scoreI,
          scoreA: latestAssessment.scoreA, scoreS: latestAssessment.scoreS,
          scoreE: latestAssessment.scoreE, scoreC: latestAssessment.scoreC
        } : null
      };
    });

    return { formatted, actor, institutionId };
  },

  getInstitutionStats: async (actorId, queryInstitutionId) => {
    const actor = await User.findByPk(actorId);
    const institutionId = resolveInstitutionId(actor, queryInstitutionId);

    if (!institutionId) return { stats: null, hollandDistribution: [] };

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
      include: [{ model: User, as: 'user', required: true, attributes: [], where: { institutionId } }],
      raw: true
    });

    const completedAssessments = await Assessment.findAll({
      where: { status: 'completed', hollandCode: { [Op.ne]: null } },
      attributes: ['id', 'hollandCode', 'scoreR', 'scoreI', 'scoreA', 'scoreS', 'scoreE', 'scoreC'],
      include: [{ model: User, as: 'user', required: true, attributes: [], where: { institutionId } }],
    });
    const hollandCounts = completedAssessments.reduce((acc, assessment) => {
      const code = scoringService.getAssessmentDisplayCode(assessment, assessment.hollandCode || '');
      if (!code) return acc;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});
    const hollandDist = Object.entries(hollandCounts)
      .map(([code, count]) => ({ hollandCode: code, hollandCodeDisplay: code, count }))
      .sort((a, b) => Number(b.count) - Number(a.count) || a.hollandCode.localeCompare(b.hollandCode));

    return { stats: { ...stats, totalStudents, studentsWithAssessments }, hollandDistribution: hollandDist, actor };
  },

  importStudents: async (actorId, csvData, queryInstitutionId) => {
    const actor = await User.findByPk(actorId);

    if (!csvData || typeof csvData !== 'string' || !csvData.trim()) {
      throw new BadRequestError('CSV data is required', 'CSV_REQUIRED');
    }

    const institutionId = resolveInstitutionId(actor, queryInstitutionId);
    if (!institutionId) {
      throw new BadRequestError('Institution is required for student import', 'INSTITUTION_REQUIRED');
    }

    const importReport = await bulkCreateStudents(csvData, institutionId);
    return { importReport, actor, institutionId };
  },

  deleteStudent: async (actorId, studentId) => {
    const { student } = await resolveScopedStudent(actorId, studentId);

    await student.destroy();
    return student;
  },

  updateStudent: async (actorId, studentId, body) => {
    const { student, actor } = await resolveScopedStudent(actorId, studentId);

    const allowed = ['firstName', 'lastName', 'gradeLevel', 'email', 'institutionId'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (actor.role !== 'System Administrator') {
      delete updates.institutionId;
    }

    await student.update(updates);
    const updated = await User.findByPk(student.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'refreshToken'] }
    });
    return updated;
  },

  getStudentResults: async (studentId) => {
    const student = await User.findOne({ where: { id: studentId, role: 'Test Taker' } });
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');

    const assessments = await Assessment.findAll({
      where: { userId: student.id },
      order: [['createdAt', 'DESC']]
    });
    assessments.forEach((assessment) => {
      assessment.setDataValue?.(
        'hollandCodeDisplay',
        scoringService.getAssessmentDisplayCode(assessment, assessment.hollandCode || null) || null
      );
    });

    const completed = assessments.find((a) => a.status === 'completed');
    let recommendations = { occupations: [], courses: [], suggestedSubjects: [] };
    if (completed) {
      try {
        const { displayCode } = scoringService.buildHollandCodes({
          R: completed.scoreR,
          I: completed.scoreI,
          A: completed.scoreA,
          S: completed.scoreS,
          E: completed.scoreE,
          C: completed.scoreC,
        }, 0);
        recommendations = await scoringService.getRecommendations(
          completed.hollandCode,
          completed.educationLevelAtTest,
          null,
          {
            scores: {
              R: completed.scoreR,
              I: completed.scoreI,
              A: completed.scoreA,
              S: completed.scoreS,
              E: completed.scoreE,
              C: completed.scoreC,
            },
            displayCode,
            userType: student?.userType,
            degreeProgram: student?.degreeProgram,
            yearOfStudy: student?.yearOfStudy,
            yearsExperience: student?.yearsExperience
          }
        );
      } catch (_) {}
    }

    return { student, assessments, recommendations };
  },

  /* ─── Login Cards ─────────────────────────────────────────────────────── */

  getLoginCardsData: async (actorId, queryInstitutionId, grade) => {
    const actor = await User.findByPk(actorId);
    const institutionId = resolveInstitutionId(actor, queryInstitutionId);

    if (!institutionId) throw new BadRequestError('Institution is required', 'INSTITUTION_REQUIRED');

    const institution = await Institution.findByPk(institutionId);
    if (!institution) throw new NotFoundError('Institution not found', 'INSTITUTION_NOT_FOUND');

    const where = { institutionId, role: 'Test Taker' };
    if (grade) {
      where[Op.or] = [{ gradeLevel: grade }, { className: grade }];
    }

    const students = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'username', 'gradeLevel', 'className', 'studentNumber', 'studentCode', 'createdAt'],
      include: [{
        model: SchoolStudent, as: 'schoolStudent', required: false,
        attributes: ['id', 'studentNumber', 'grade', 'className', 'loginCardPrinted']
      }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    if (students.length === 0) throw new NotFoundError('No students found for these criteria', 'NO_STUDENTS_FOUND');

    return { students, institution, actor };
  },

  markLoginCardsPrinted: async (students) => {
    const schoolStudentIds = students.map(s => s.schoolStudent?.id).filter(Boolean);
    if (schoolStudentIds.length > 0) {
      SchoolStudent.update(
        { loginCardPrinted: true, loginCardPrintedAt: new Date() },
        { where: { id: schoolStudentIds } }
      ).catch(() => {});
    }
  }
};

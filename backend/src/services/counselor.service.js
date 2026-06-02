'use strict';

const { User, Assessment, Institution, SchoolStudent } = require('../models');
const { Op } = require('sequelize');
const { bulkCreateStudents } = require('./studentImport.service');
const scoringService = require('./scoring.service');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errors/appError');

const generateTempCardPassword = () => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < 10; i += 1) {
    pwd += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  if (!/[A-Z]/.test(pwd)) pwd = `A${pwd.slice(1)}`;
  if (!/[a-z]/.test(pwd)) pwd = `${pwd.slice(0, 1)}a${pwd.slice(2)}`;
  if (!/\d/.test(pwd)) pwd = `${pwd.slice(0, pwd.length - 1)}7`;
  if (!/[!@#$%^&*]/.test(pwd)) pwd = `${pwd.slice(0, pwd.length - 2)}!${pwd.slice(-1)}`;
  return pwd;
};

const normalizeGradeToken = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

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
    // System Administrators may import without an explicit scope and rely on
    // institution names provided in the CSV rows.
    if (!institutionId && actor?.role !== 'System Administrator') {
      throw new BadRequestError(
        'Institution is required for student import. Assign this test administrator to an institution or provide institutionId.',
        'INSTITUTION_REQUIRED'
      );
    }

    const importReport = await bulkCreateStudents(csvData, institutionId || null);
    return { importReport, actor, institutionId: institutionId || null };
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

    const students = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'username', 'gradeLevel', 'className', 'studentNumber', 'studentCode', 'createdAt'],
      include: [{
        model: SchoolStudent, as: 'schoolStudent', required: false,
        attributes: ['id', 'studentNumber', 'grade', 'className', 'loginCardPrinted']
      }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    const filteredStudents = grade
      ? students.filter((student) => {
          const wanted = normalizeGradeToken(grade);
          const userGrade = normalizeGradeToken(student.gradeLevel || '');
          const userClass = normalizeGradeToken(student.className || '');
          const schoolGrade = normalizeGradeToken(student.schoolStudent?.grade || '');
          const schoolClass = normalizeGradeToken(student.schoolStudent?.className || '');
          return [userGrade, userClass, schoolGrade, schoolClass].some((value) => value && value === wanted);
        })
      : students;

    if (filteredStudents.length === 0) {
      throw new NotFoundError('No students found for these criteria', 'NO_STUDENTS_FOUND');
    }

    const transaction = await User.sequelize.transaction();
    try {
      for (const student of filteredStudents) {
        const tempPassword = generateTempCardPassword();
        await student.update({
          password: tempPassword,
          mustChangePassword: true
        }, { transaction });
        student.setDataValue('loginCardPassword', tempPassword);
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return { students: filteredStudents, institution, actor };
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

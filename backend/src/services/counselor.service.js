'use strict';

const { User, Assessment, Institution, SchoolStudent } = require('../models');
const { Op } = require('sequelize');
const { bulkCreateStudents } = require('./studentImport.service');
const scoringService = require('./scoring.service');

const resolveInstitutionId = (actor, queryParam) => {
  if (actor.role === 'System Administrator') return queryParam || null;
  return actor.institutionId || null;
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

    const hollandDist = await Assessment.findAll({
      where: { status: 'completed', hollandCode: { [Op.ne]: null } },
      attributes: [
        'hollandCode',
        [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'count']
      ],
      include: [{ model: User, as: 'user', required: true, attributes: [], where: { institutionId } }],
      group: ['hollandCode'],
      raw: true
    });

    return { stats: { ...stats, totalStudents, studentsWithAssessments }, hollandDistribution: hollandDist, actor };
  },

  importStudents: async (actorId, csvData, queryInstitutionId) => {
    const actor = await User.findByPk(actorId);
    const institutionId = resolveInstitutionId(actor, queryInstitutionId);

    if (!csvData || typeof csvData !== 'string' || !csvData.trim()) {
      throw new Error('CSV data is required');
    }
    if (!institutionId) throw new Error('Institution is required');

    const credentials = await bulkCreateStudents(csvData, institutionId);
    return { credentials, actor, institutionId };
  },

  deleteStudent: async (actorId, actorRole, actorInstitutionId, studentId) => {
    const student = await User.findOne({ where: { id: studentId, role: 'Test Taker' } });
    if (!student) throw new Error('Student not found');

    if (actorRole === 'Test Administrator' && student.institutionId !== actorInstitutionId) {
      throw Object.assign(new Error('Not authorized to manage this student'), { status: 403 });
    }

    await student.destroy();
    return student;
  },

  updateStudent: async (actorRole, actorInstitutionId, studentId, body) => {
    const student = await User.findOne({ where: { id: studentId, role: 'Test Taker' } });
    if (!student) throw new Error('Student not found');

    if (actorRole === 'Test Administrator' && student.institutionId !== actorInstitutionId) {
      throw Object.assign(new Error('Not authorized to manage this student'), { status: 403 });
    }

    const allowed = ['firstName', 'lastName', 'gradeLevel', 'email', 'institutionId'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    await student.update(updates);
    const updated = await User.findByPk(student.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'refreshToken'] }
    });
    return updated;
  },

  getStudentResults: async (actorRole, actorInstitutionId, studentId) => {
    const student = await User.findOne({ where: { id: studentId, role: 'Test Taker' } });
    if (!student) throw new Error('Student not found');

    if (actorRole === 'Test Administrator' && student.institutionId !== actorInstitutionId) {
      throw Object.assign(new Error('Not authorized to view this student'), { status: 403 });
    }

    const assessments = await Assessment.findAll({
      where: { userId: student.id },
      order: [['createdAt', 'DESC']]
    });

    const completed = assessments.find((a) => a.status === 'completed');
    let recommendations = { occupations: [], courses: [], suggestedSubjects: [] };
    if (completed) {
      try {
        recommendations = await scoringService.getRecommendations(completed.hollandCode, completed.educationLevelAtTest);
      } catch (_) {}
    }

    return { student, assessments, recommendations };
  },

  /* ─── Login Cards ─────────────────────────────────────────────────────── */

  getLoginCardsData: async (actorId, actorRole, actorInstitutionId, queryInstitutionId, grade) => {
    const actor = await User.findByPk(actorId);
    const institutionId = resolveInstitutionId(actor, queryInstitutionId);

    if (!institutionId) throw new Error('Institution is required');

    const institution = await Institution.findByPk(institutionId);
    if (!institution) throw new Error('Institution not found');

    const where = { institutionId, role: 'Test Taker' };
    if (grade) {
      where[Op.or] = [{ gradeLevel: grade }, { className: grade }];
    }

    const students = await User.findAll({
      where,
      attributes: ['id', 'firstName', 'lastName', 'username', 'gradeLevel', 'className', 'studentNumber', 'studentCode', 'createdAt'],
      include: [{
        model: SchoolStudent, as: 'schoolStudent', required: false,
        attributes: ['studentNumber', 'grade', 'className', 'loginCardPrinted']
      }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });

    if (students.length === 0) throw new Error('No students found for these criteria');

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

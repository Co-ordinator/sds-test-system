const { User, Assessment } = require('../models');
const logger = require('../utils/logger');

/**
 * Counselor Controller
 * Provides student roster and institution-level stats for dashboards.
 */
const getMyStudents = async (req, res, next) => {
  try {
    const counselor = await User.findByPk(req.user.id);
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!counselor.institutionId) {
      return res.status(200).json({ status: 'success', data: { students: [] } });
    }

    const students = await User.findAll({
      where: {
        role: 'user',
        institutionId: counselor.institutionId
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'gradeLevel', 'institutionId'],
      include: [
        {
          model: Assessment,
          as: 'assessments',
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
          attributes: ['id', 'status', 'progress', 'hollandCode', 'createdAt', 'completedAt']
        }
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
        latestAssessment: latestAssessment
          ? {
              id: latestAssessment.id,
              status: latestAssessment.status,
              progress: Number(latestAssessment.progress),
              hollandCode: latestAssessment.hollandCode,
              createdAt: latestAssessment.createdAt,
              completedAt: latestAssessment.completedAt
            }
          : null
      };
    });

    logger.info({
      actionType: 'COUNSELOR_STUDENTS_FETCHED',
      message: `Counselor ${counselor.id} fetched ${formatted.length} students`,
      req,
      details: { counselorId: counselor.id, institutionId: counselor.institutionId }
    });

    return res.status(200).json({ status: 'success', data: { students: formatted } });
  } catch (error) {
    logger.error({
      actionType: 'COUNSELOR_STUDENTS_FAILED',
      message: 'Failed to fetch counselor students',
      req,
      details: { error: error.message, stack: error.stack, counselorId: req.user?.id }
    });
    return next(error);
  }
};

const getInstitutionStats = async (req, res, next) => {
  try {
    const counselor = await User.findByPk(req.user.id);
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(403).json({ status: 'error', message: 'Unauthorized' });
    }

    if (!counselor.institutionId) {
      return res.status(200).json({ status: 'success', data: { stats: null } });
    }

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
      include: [
        {
          model: User,
          as: 'user',
          required: true,
          attributes: [],
          where: { institutionId: counselor.institutionId }
        }
      ],
      raw: true
    });

    logger.info({
      actionType: 'COUNSELOR_INSTITUTION_STATS',
      message: `Fetched institution stats for counselor ${counselor.id}`,
      req,
      details: { counselorId: counselor.id, institutionId: counselor.institutionId }
    });

    return res.status(200).json({ status: 'success', data: { stats } });
  } catch (error) {
    logger.error({
      actionType: 'COUNSELOR_INSTITUTION_STATS_FAILED',
      message: 'Failed to fetch institution stats',
      req,
      details: { error: error.message, stack: error.stack, counselorId: req.user?.id }
    });
    return next(error);
  }
};

module.exports = {
  getMyStudents,
  getInstitutionStats
};

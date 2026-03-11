const { User, AuditLog, Assessment, Institution, Occupation, Course, CourseInstitution, CourseRequirement } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

const buildAnalyticsFilters = (query) => {
  const { institutionId, region, userType, institutionType, startDate, endDate } = query;
  const userWhere = {};
  const institutionWhere = {};
  const assessmentWhere = {};

  if (institutionId) userWhere.institutionId = institutionId;
  if (region) userWhere.region = region;
  if (userType) userWhere.userType = userType;
  if (institutionType) institutionWhere.type = institutionType;

  if (startDate || endDate) {
    assessmentWhere.createdAt = {};
    if (startDate) assessmentWhere.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) assessmentWhere.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
  }

  const userInclude = Object.keys(institutionWhere).length > 0
    ? [{ model: Institution, as: 'institution', required: true, attributes: [], where: institutionWhere }]
    : [];

  const assessmentInclude = Object.keys(userWhere).length > 0 || userInclude.length > 0
    ? [{
        model: User,
        as: 'user',
        required: true,
        attributes: [],
        where: userWhere,
        include: userInclude
      }]
    : [];

  return { userWhere, institutionWhere, assessmentWhere, userInclude, assessmentInclude };
};

const formatFilterLabel = (value, fallback = 'All') => value || fallback;

const countUsersWithFilters = ({ userWhere, userInclude, extraWhere = {} }) => {
  if (userInclude.length > 0) {
    return User.count({
      where: { ...userWhere, ...extraWhere },
      include: userInclude,
      distinct: true,
      col: 'id'
    });
  }

  return User.count({ where: { ...userWhere, ...extraWhere } });
};

module.exports = {
  // Get all users with optional filters
  getAllUsers: async (req, res, next) => {
    try {
      const { role, educationLevel, search } = req.query;

      const where = {};
      if (role) where.role = role;
      if (educationLevel) where.educationLevel = educationLevel;
      if (search) {
        where[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Fetching users',
        req,
        details: {
          adminId: req.user?.id,
          filters: { role, educationLevel, search }
        }
      });
      
      const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
        where
      });

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: `Fetched ${users.length} users`,
        req,
        details: {
          adminId: req.user?.id
        }
      });
      
      res.status(200).json({
        status: 'success',
        results: users.length,
        data: { users }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to fetch users',
        req,
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      next(error);
    }
  },

  // Get single user
  getUser: async (req, res, next) => {
    try {
      logger.info({
        actionType: 'ADMIN_ACTION',
        message: `Fetching user ${req.params.id}`,
        req,
        details: {
          adminId: req.user?.id
        }
      });
      
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        logger.warn({
          actionType: 'ADMIN_ACTION',
          message: `User not found: ${req.params.id}`,
          req,
          details: {
            adminId: req.user?.id
          }
        });
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { user }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: `Failed to fetch user ${req.params.id}`,
        req,
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      next(error);
    }
  },

  // Delete user
  deleteUser: async (req, res, next) => {
    try {
      logger.info({
        actionType: 'USER_DELETION',
        message: `Attempting to delete user ${req.params.id}`,
        req,
        details: {
          deletedBy: req.user?.id
        }
      });
      
      const user = await User.findByPk(req.params.id);

      if (!user) {
        logger.warn({
          actionType: 'USER_DELETION',
          message: `User not found for deletion: ${req.params.id}`,
          req,
          details: {
            deletedBy: req.user?.id
          }
        });
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      await user.destroy();
      await AuditLog.create({
        userId: req.user?.id,
        actionType: 'USER_DELETED',
        description: 'User account deleted by admin',
        details: {
          resourceType: 'user',
          resourceId: req.params.id,
          requestMethod: req.method
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      logger.info({
        actionType: 'USER_DELETION',
        message: `User deleted: ${req.params.id}`,
        req,
        details: {
          deletedBy: req.user?.id
        }
      });

      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      logger.error({
        actionType: 'USER_DELETION_FAILED',
        message: `Failed to delete user ${req.params.id}`,
        req,
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      next(error);
    }
  },

  // Get system analytics
  getAnalytics: async (req, res, next) => {
    try {
      const { userWhere, assessmentWhere, userInclude, assessmentInclude } = buildAnalyticsFilters(req.query);

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Fetching system analytics',
        req,
        details: {
          adminId: req.user?.id
        }
      });

      const [studentCount, counselorCount] = await Promise.all([
        countUsersWithFilters({ userWhere, userInclude: assessmentInclude[0]?.include || [], extraWhere: { role: 'user' } }),
        User.count({ where: { role: 'counselor' } })
      ]);

      const totalAssessments = await Assessment.count({ where: assessmentWhere, include: assessmentInclude });
      const completedAssessments = await Assessment.count({ where: { ...assessmentWhere, status: 'completed' }, include: assessmentInclude });
      const completionRate = totalAssessments === 0 ? 0 : (completedAssessments / totalAssessments) * 100;

      const averages = await Assessment.findOne({
        where: assessmentWhere,
        attributes: [
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_r')), 'avgR'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_i')), 'avgI'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_a')), 'avgA'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_s')), 'avgS'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_e')), 'avgE'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_c')), 'avgC']
        ],
        include: assessmentInclude,
        raw: true
      });

      const totalUsers = await countUsersWithFilters({ userWhere, userInclude });

      return res.status(200).json({
        status: 'success',
        data: {
          totals: {
            users: totalUsers,
            students: studentCount,
            counselors: counselorCount,
            assessments: totalAssessments,
            completedAssessments
          },
          completionRate: Number(completionRate.toFixed(2)),
          riasecAverages: averages
        }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to fetch analytics',
        req,
        details: {
          error: error.message,
          stack: error.stack,
          adminId: req.user?.id
        }
      });
      next(error);
    }
  },

  // Get audit logs
  getAuditLogs: async (req, res, next) => {
    try {
      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Fetching audit logs',
        req,
        details: {
          adminId: req.user?.id
        }
      });
      
      const logs = await AuditLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100
      });

      logger.info({
        actionType: 'ADMIN_ACTION',
        message: `Fetched ${logs.length} audit logs`,
        req,
        details: {
          adminId: req.user?.id
        }
      });
      
      res.status(200).json({
        status: 'success',
        results: logs.length,
        data: { logs }
      });
    } catch (error) {
      await AuditLog.create({
        userId: req.user?.id,
        actionType: 'AUDIT_LOG_FETCH_FAILED',
        description: 'Failed to fetch audit logs',
        details: {
          resourceType: 'audit_log',
          requestMethod: req.method,
          isSuspicious: true,
          securityLevel: 'medium',
          error: error.message
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: 'Failed to fetch audit logs',
        req,
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      next(error);
    }
  },

  // Get single audit log
  getAuditLog: async (req, res, next) => {
    try {
      const log = await AuditLog.findByPk(req.params.id);
      if (!log) {
        return res.status(404).json({ status: 'error', message: 'Audit log not found' });
      }
      res.status(200).json({ status: 'success', data: { log } });
    } catch (error) {
      next(error);
    }
  },

  // Update a user (role, institutionId, isActive)
  updateUser: async (req, res, next) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }

      const allowed = ['role', 'institutionId', 'isActive', 'firstName', 'lastName', 'email'];
      const updates = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      }

      await user.update(updates);
      const updated = await User.findByPk(user.id, { attributes: { exclude: ['password', 'passwordResetToken', 'refreshToken'] } });

      logger.info({ actionType: 'ADMIN_USER_UPDATE', message: `User ${req.params.id} updated`, req, details: { adminId: req.user?.id, updates } });
      res.status(200).json({ status: 'success', data: { user: updated } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to update user', req, details: { error: error.message } });
      next(error);
    }
  },

  // List all assessments with optional filters (admin/counselor)
  getAllAssessments: async (req, res, next) => {
    try {
      const { status, institutionId, search, limit = 100, offset = 0 } = req.query;
      const userWhere = {};
      if (institutionId) userWhere.institutionId = institutionId;
      if (search) {
        userWhere[Op.or] = [
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const where = {};
      if (status) where.status = status;

      const assessments = await Assessment.findAll({
        where,
        include: [{
          model: User, as: 'user', required: Object.keys(userWhere).length > 0,
          where: userWhere,
          attributes: ['id', 'firstName', 'lastName', 'email', 'institutionId'],
          include: [{ model: Institution, as: 'institution', attributes: ['id', 'name'] }]
        }],
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset: Number(offset)
      });

      const total = await Assessment.count({
        where,
        include: Object.keys(userWhere).length > 0 ? [{ model: User, as: 'user', required: true, where: userWhere }] : []
      });

      res.status(200).json({ status: 'success', results: assessments.length, total, data: { assessments } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to list assessments', req, details: { error: error.message } });
      next(error);
    }
  },

  // Per-institution analytics
  getInstitutionAnalytics: async (req, res, next) => {
    try {
      const institutions = await Institution.findAll({ order: [['name', 'ASC']] });

      const results = await Promise.all(institutions.map(async (inst) => {
        const totalStudents = await User.count({ where: { institutionId: inst.id, role: 'user' } });
        const totalAssessments = await Assessment.count({
          include: [{ model: User, as: 'user', required: true, where: { institutionId: inst.id } }]
        });
        const completedAssessments = await Assessment.count({
          where: { status: 'completed' },
          include: [{ model: User, as: 'user', required: true, where: { institutionId: inst.id } }]
        });
        return {
          institutionId: inst.id,
          institutionName: inst.name,
          region: inst.region,
          type: inst.type,
          totalStudents,
          totalAssessments,
          completedAssessments,
          completionRate: totalAssessments > 0 ? Number(((completedAssessments / totalAssessments) * 100).toFixed(1)) : 0
        };
      }));

      res.status(200).json({ status: 'success', data: { institutions: results } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get institution analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  // Holland code distribution
  getHollandDistribution: async (req, res, next) => {
    try {
      const { assessmentWhere, assessmentInclude } = buildAnalyticsFilters(req.query);

      const distribution = await Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
        attributes: [
          'hollandCode',
          [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'count']
        ],
        include: assessmentInclude,
        group: ['hollandCode'],
        order: [[Assessment.sequelize.literal('"count"'), 'DESC']],
        raw: true
      });

      res.status(200).json({ status: 'success', data: { distribution } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get Holland distribution', req, details: { error: error.message } });
      next(error);
    }
  },

  // Monthly assessment trend (last 12 months)
  getAssessmentTrend: async (req, res, next) => {
    try {
      const { assessmentWhere, assessmentInclude } = buildAnalyticsFilters(req.query);

      const trendWhere = { ...assessmentWhere };
      if (!trendWhere.createdAt) {
        trendWhere.createdAt = { [Op.gte]: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) };
      } else if (!trendWhere.createdAt[Op.gte]) {
        trendWhere.createdAt[Op.gte] = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      }

      const trend = await Assessment.findAll({
        where: trendWhere,
        include: assessmentInclude,
        attributes: [
          [Assessment.sequelize.fn('DATE_TRUNC', 'month', Assessment.sequelize.col('created_at')), 'month'],
          [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('id')), 'total'],
          [Assessment.sequelize.fn('SUM', Assessment.sequelize.literal("CASE WHEN status='completed' THEN 1 ELSE 0 END")), 'completed']
        ],
        group: [Assessment.sequelize.fn('DATE_TRUNC', 'month', Assessment.sequelize.col('created_at'))],
        order: [[Assessment.sequelize.fn('DATE_TRUNC', 'month', Assessment.sequelize.col('created_at')), 'ASC']],
        raw: true
      });

      res.status(200).json({ status: 'success', data: { trend } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get trend data', req, details: { error: error.message } });
      next(error);
    }
  },

  // Export users as CSV
  exportUsers: async (req, res, next) => {
    try {
      const { role, institutionId } = req.query;
      const where = {};
      if (role) where.role = role;
      if (institutionId) where.institutionId = institutionId;

      const users = await User.findAll({
        where,
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'region', 'gradeLevel', 'institutionId', 'createdAt', 'lastLogin'],
        include: [{ model: Institution, as: 'institution', attributes: ['name'] }],
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true
      });

      const rows = users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email || '',
        role: u.role,
        region: u.region || '',
        gradeLevel: u.gradeLevel || '',
        institution: u.institution?.name || '',
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : '',
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : ''
      }));

      const parser = new Parser({ fields: ['id','firstName','lastName','email','role','region','gradeLevel','institution','createdAt','lastLogin'] });
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('users_export.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export users', req, details: { error: error.message } });
      next(error);
    }
  },

  // Export assessments as CSV
  exportAssessments: async (req, res, next) => {
    try {
      const { institutionId, status } = req.query;
      const where = {};
      if (status) where.status = status;

      const assessments = await Assessment.findAll({
        where,
        include: [{
          model: User, as: 'user', required: false,
          where: institutionId ? { institutionId } : {},
          attributes: ['firstName', 'lastName', 'email', 'institutionId'],
          include: [{ model: Institution, as: 'institution', attributes: ['name'] }]
        }],
        order: [['createdAt', 'DESC']],
        raw: true,
        nest: true
      });

      const rows = assessments.map((a) => ({
        id: a.id,
        firstName: a.user?.firstName || '',
        lastName: a.user?.lastName || '',
        email: a.user?.email || '',
        institution: a.user?.institution?.name || '',
        status: a.status,
        hollandCode: a.hollandCode || '',
        scoreR: a.scoreR,
        scoreI: a.scoreI,
        scoreA: a.scoreA,
        scoreS: a.scoreS,
        scoreE: a.scoreE,
        scoreC: a.scoreC,
        completedAt: a.completedAt ? new Date(a.completedAt).toISOString() : '',
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : ''
      }));

      const parser = new Parser({ fields: ['id','firstName','lastName','email','institution','status','hollandCode','scoreR','scoreI','scoreA','scoreS','scoreE','scoreC','completedAt','createdAt'] });
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('assessments_export.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export assessments', req, details: { error: error.message } });
      next(error);
    }
  },

  // Get notifications (completed assessment events for admins)
  getNotifications: async (req, res, next) => {
    try {
      const { limit = 50 } = req.query;

      const notifications = await AuditLog.findAll({
        where: { actionType: 'ASSESSMENT_COMPLETED_NOTIFY' },
        order: [['createdAt', 'DESC']],
        limit: Number(limit)
      });

      const unreadCount = notifications.filter(n => n.details?.isRead !== true).length;

      res.status(200).json({ status: 'success', data: { notifications, unreadCount } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get notifications', req, details: { error: error.message } });
      next(error);
    }
  },

  // Mark notification as read
  markNotificationRead: async (req, res, next) => {
    try {
      const log = await AuditLog.findByPk(req.params.id);
      if (!log) return res.status(404).json({ status: 'error', message: 'Notification not found' });

      const details = { ...(log.details || {}), isRead: true };
      await log.update({ details });

      res.status(200).json({ status: 'success', data: { notification: log } });
    } catch (error) {
      next(error);
    }
  },

  // Mark all notifications as read (fetch-update pattern to avoid raw SQL)
  markAllNotificationsRead: async (req, res, next) => {
    try {
      const all = await AuditLog.findAll({ where: { actionType: 'ASSESSMENT_COMPLETED_NOTIFY' } });
      await Promise.all(all.map(n => n.update({ details: { ...(n.details || {}), isRead: true } })));
      res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  },

  // National regional analytics: breakdown by region across all institutions
  getRegionalAnalytics: async (req, res, next) => {
    try {
      const { Op, fn, col } = require('sequelize');
      const { userWhere: baseUserWhere, assessmentWhere, userInclude, assessmentInclude: baseAssessmentInclude } = buildAnalyticsFilters(req.query);
      const userWhere = { ...baseUserWhere, role: 'user', region: baseUserWhere.region || { [Op.ne]: null } };
      const assessmentInclude = [{
        model: User,
        as: 'user',
        attributes: [],
        where: userWhere,
        required: true,
        include: userInclude
      }];

      // 1. User counts by region
      const usersByRegion = await User.findAll({
        where: userWhere,
        include: userInclude,
        attributes: [
          'region',
          [fn('COUNT', col('User.id')), 'totalUsers'],
        ],
        group: ['region'],
        raw: true
      });

      // 2. Completed assessments by region
      const completedByRegion = await Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed' },
        include: assessmentInclude,
        attributes: [
          [col('user.region'), 'region'],
          [fn('COUNT', col('Assessment.id')), 'completedAssessments'],
          [fn('AVG', col('Assessment.score_r')), 'avgR'],
          [fn('AVG', col('Assessment.score_i')), 'avgI'],
          [fn('AVG', col('Assessment.score_a')), 'avgA'],
          [fn('AVG', col('Assessment.score_s')), 'avgS'],
          [fn('AVG', col('Assessment.score_e')), 'avgE'],
          [fn('AVG', col('Assessment.score_c')), 'avgC'],
        ],
        group: [col('user.region')],
        raw: true
      });

      // 3. Top Holland codes by region
      const hollandByRegion = await Assessment.findAll({
        where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
        include: assessmentInclude,
        attributes: [
          [col('user.region'), 'region'],
          'hollandCode',
          [fn('COUNT', col('Assessment.id')), 'count']
        ],
        group: [col('user.region'), 'Assessment.holland_code'],
        order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
        raw: true
      });

      // 4. User type distribution nationally
      const userTypeDistribution = await User.findAll({
        where: { ...userWhere, userType: userType || { [Op.ne]: null } },
        attributes: [
          'userType',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['userType'],
        raw: true
      });

      // 5. Merge data by region
      const REGIONS = ['hhohho', 'manzini', 'lubombo', 'shiselweni'];
      const regionMap = {};
      REGIONS.forEach(r => {
        regionMap[r] = { region: r, totalUsers: 0, completedAssessments: 0, topCode: null, avgR: 0, avgI: 0, avgA: 0, avgS: 0, avgE: 0, avgC: 0 };
      });

      usersByRegion.forEach(row => {
        const r = (row.region || '').toLowerCase();
        if (regionMap[r]) regionMap[r].totalUsers = parseInt(row.totalUsers, 10) || 0;
      });

      completedByRegion.forEach(row => {
        const r = (row.region || '').toLowerCase();
        if (regionMap[r]) {
          regionMap[r].completedAssessments = parseInt(row.completedAssessments, 10) || 0;
          regionMap[r].avgR = parseFloat(row.avgR || 0).toFixed(1);
          regionMap[r].avgI = parseFloat(row.avgI || 0).toFixed(1);
          regionMap[r].avgA = parseFloat(row.avgA || 0).toFixed(1);
          regionMap[r].avgS = parseFloat(row.avgS || 0).toFixed(1);
          regionMap[r].avgE = parseFloat(row.avgE || 0).toFixed(1);
          regionMap[r].avgC = parseFloat(row.avgC || 0).toFixed(1);
        }
      });

      // Pick top Holland code per region
      const seen = {};
      hollandByRegion.forEach(row => {
        const r = (row.region || '').toLowerCase();
        if (regionMap[r] && !seen[r]) {
          regionMap[r].topCode = row.hollandCode;
          seen[r] = true;
        }
      });

      // 6. Summary totals
      const totalUsers = await countUsersWithFilters({ userWhere, userInclude });
      const totalAssessments = await Assessment.count({
        where: assessmentWhere,
        include: assessmentInclude
      });
      const completedAssessments = await Assessment.count({
        where: { ...assessmentWhere, status: 'completed' },
        include: assessmentInclude
      });

      res.status(200).json({
        status: 'success',
        data: {
          summary: { totalUsers, totalAssessments, completedAssessments },
          regions: Object.values(regionMap),
          hollandByRegion,
          userTypeDistribution
        }
      });
    } catch (error) {
      next(error);
    }
  },

  getKnowledgeGraphAnalytics: async (req, res, next) => {
    try {
      const { fn, col, literal } = require('sequelize');

      // 1. Career demand distribution
      const demandDistribution = await Occupation.findAll({
        attributes: ['demandLevel', [fn('COUNT', col('id')), 'count']],
        where: { demandLevel: { [Op.ne]: null } },
        group: ['demandLevel'],
        order: [[literal('"count"'), 'DESC']],
        raw: true
      });

      // 2. Local demand distribution
      const localDemandDist = await Occupation.findAll({
        attributes: ['localDemand', [fn('COUNT', col('id')), 'count']],
        where: { localDemand: { [Op.ne]: null } },
        group: ['localDemand'],
        order: [[literal('"count"'), 'DESC']],
        raw: true
      });

      // 3. RIASEC → Career count (how many careers per primary RIASEC)
      const riasecCareerFlow = await Occupation.findAll({
        attributes: ['primaryRiasec', [fn('COUNT', col('id')), 'count']],
        where: { primaryRiasec: { [Op.ne]: null } },
        group: ['primaryRiasec'],
        order: [[literal('"count"'), 'DESC']],
        raw: true
      });

      // 4. Course stats by qualification type
      const coursesByQualType = await Course.findAll({
        attributes: ['qualificationType', [fn('COUNT', col('id')), 'count']],
        where: { isActive: true },
        group: ['qualificationType'],
        order: [[literal('"count"'), 'DESC']],
        raw: true
      });

      // 5. Institution course coverage (how many courses per institution)
      const institutionCoverage = await CourseInstitution.findAll({
        attributes: [
          'institutionId',
          [fn('COUNT', col('CourseInstitution.id')), 'courseCount']
        ],
        where: { isActive: true },
        include: [{ model: Institution, as: 'institution', attributes: ['name', 'type', 'region'] }],
        group: ['institutionId', 'institution.id'],
        order: [[literal('"courseCount"'), 'DESC']],
        raw: true,
        nest: true
      });

      // 6. Skill clusters from occupations (flatten skills arrays, count frequency)
      const allOccupations = await Occupation.findAll({
        attributes: ['skills', 'primaryRiasec', 'name', 'demandLevel', 'localDemand', 'category'],
        raw: true
      });
      const skillFreq = {};
      allOccupations.forEach(occ => {
        (occ.skills || []).forEach(skill => {
          const s = skill.trim();
          if (s) skillFreq[s] = (skillFreq[s] || 0) + 1;
        });
      });
      const topSkills = Object.entries(skillFreq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 30)
        .map(([skill, count]) => ({ skill, count }));

      // 7. Top Holland codes matched to careers (from completed assessments)
      const topHollandCareerMatches = await Assessment.findAll({
        where: { status: 'completed', hollandCode: { [Op.ne]: null } },
        attributes: [
          'hollandCode',
          [fn('COUNT', col('Assessment.id')), 'assessmentCount']
        ],
        group: ['hollandCode'],
        order: [[literal('"assessmentCount"'), 'DESC']],
        limit: 15,
        raw: true
      });

      // 8. Gender distribution of completed assessments
      const genderDist = await Assessment.findAll({
        where: { status: 'completed' },
        include: [{
          model: User, as: 'user', required: true, attributes: [],
          where: { gender: { [Op.ne]: null } }
        }],
        attributes: [
          [col('user.gender'), 'gender'],
          [fn('COUNT', col('Assessment.id')), 'count']
        ],
        group: [col('user.gender')],
        raw: true
      });

      // 9. Career categories distribution
      const careerCategories = await Occupation.findAll({
        attributes: ['category', [fn('COUNT', col('id')), 'count']],
        where: { category: { [Op.ne]: null } },
        group: ['category'],
        order: [[literal('"count"'), 'DESC']],
        raw: true
      });

      // 10. Top careers (occupations with most assessment holland code matches)
      const topCareers = allOccupations
        .filter(o => o.primaryRiasec)
        .map(o => ({
          name: o.name,
          primaryRiasec: o.primaryRiasec,
          demandLevel: o.demandLevel,
          localDemand: o.localDemand,
          category: o.category
        }))
        .slice(0, 50);

      // 11. Total counts for knowledge graph summary
      const [totalOccupations, totalCourses, totalInstitutions, totalCourseLinks] = await Promise.all([
        Occupation.count(),
        Course.count({ where: { isActive: true } }),
        Institution.count(),
        CourseInstitution.count({ where: { isActive: true } })
      ]);

      // 12. Courses per RIASEC letter (unnest riasec_codes array)
      const coursesPerRiasec = [];
      for (const letter of ['R', 'I', 'A', 'S', 'E', 'C']) {
        const count = await Course.count({
          where: {
            isActive: true,
            riasecCodes: { [Op.contains]: [letter] }
          }
        });
        coursesPerRiasec.push({ letter, count });
      }

      // 13. Assessment completion by day of week (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const completionByDow = await Assessment.findAll({
        where: { status: 'completed', completedAt: { [Op.gte]: ninetyDaysAgo } },
        attributes: [
          [fn('EXTRACT', literal("DOW FROM completed_at")), 'dow'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('EXTRACT', literal("DOW FROM completed_at"))],
        order: [[fn('EXTRACT', literal("DOW FROM completed_at")), 'ASC']],
        raw: true
      });

      res.status(200).json({
        status: 'success',
        data: {
          summary: { totalOccupations, totalCourses, totalInstitutions, totalCourseLinks },
          demandDistribution,
          localDemandDist,
          riasecCareerFlow,
          coursesByQualType,
          institutionCoverage,
          topSkills,
          topHollandCareerMatches,
          genderDist,
          careerCategories,
          topCareers,
          coursesPerRiasec,
          completionByDow
        }
      });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get knowledge graph analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  exportAnalytics: async (req, res, next) => {
    try {
      const format = (req.query.format || 'csv').toLowerCase();
      const { userWhere, assessmentWhere, userInclude, assessmentInclude } = buildAnalyticsFilters(req.query);

      const [analyticsRes, hollandRes, regionalRes] = await Promise.all([
        (async () => {
          const [studentCount, totalUsers, totalAssessments, completedAssessments, averages] = await Promise.all([
            countUsersWithFilters({ userWhere, userInclude, extraWhere: { role: 'user' } }),
            countUsersWithFilters({ userWhere, userInclude }),
            Assessment.count({ where: assessmentWhere, include: assessmentInclude }),
            Assessment.count({ where: { ...assessmentWhere, status: 'completed' }, include: assessmentInclude }),
            Assessment.findOne({
              where: assessmentWhere,
              attributes: [
                [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_r')), 'avgR'],
                [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_i')), 'avgI'],
                [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_a')), 'avgA'],
                [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_s')), 'avgS'],
                [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_e')), 'avgE'],
                [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_c')), 'avgC']
              ],
              include: assessmentInclude,
              raw: true
            })
          ]);
          return {
            totalUsers,
            studentCount,
            totalAssessments,
            completedAssessments,
            completionRate: totalAssessments === 0 ? 0 : Number(((completedAssessments / totalAssessments) * 100).toFixed(2)),
            averages: averages || {}
          };
        })(),
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
          attributes: [
            'hollandCode',
            [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'count']
          ],
          include: assessmentInclude,
          group: ['hollandCode'],
          order: [[Assessment.sequelize.literal('"count"'), 'DESC']],
          raw: true
        }),
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed' },
          include: [{ model: User, as: 'user', required: true, attributes: [], where: { ...userWhere, role: 'user', region: userWhere.region || { [Op.ne]: null } }, include: userInclude }],
          attributes: [
            [Assessment.sequelize.col('user.region'), 'region'],
            [Assessment.sequelize.fn('COUNT', Assessment.sequelize.col('Assessment.id')), 'completedAssessments']
          ],
          group: [Assessment.sequelize.col('user.region')],
          raw: true
        })
      ]);

      if (format === 'pdf') {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics_report.pdf"');
        doc.pipe(res);

        const pageWidth = doc.page.width - 100;
        const filtersSummary = [
          `Institution: ${formatFilterLabel(req.query.institutionId, 'All')}`,
          `Institution Type: ${formatFilterLabel(req.query.institutionType, 'All')}`,
          `Region: ${formatFilterLabel(req.query.region, 'All')}`,
          `User Type: ${formatFilterLabel(req.query.userType, 'All')}`,
          `Start Date: ${formatFilterLabel(req.query.startDate, 'Any')}`,
          `End Date: ${formatFilterLabel(req.query.endDate, 'Any')}`
        ];

        doc.rect(50, 50, pageWidth, 55).fill('#1e3a5f');
        doc.fillColor('white').fontSize(16).font('Helvetica-Bold').text('Analytics Report', 65, 68);
        doc.fillColor('#111827').moveDown(3).fontSize(10).font('Helvetica-Bold').text('Applied Filters');
        doc.fontSize(8.5).font('Helvetica').fillColor('#374151').text(filtersSummary.join('  |  '));
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Summary');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        doc.text(`Registered Users: ${analyticsRes.totalUsers}`);
        doc.text(`Students: ${analyticsRes.studentCount}`);
        doc.text(`Total Assessments: ${analyticsRes.totalAssessments}`);
        doc.text(`Completed Assessments: ${analyticsRes.completedAssessments}`);
        doc.text(`Completion Rate: ${analyticsRes.completionRate}%`);
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('RIASEC Averages');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        ['avgR', 'avgI', 'avgA', 'avgS', 'avgE', 'avgC'].forEach((key) => {
          doc.text(`${key.toUpperCase().replace('AVG', '')}: ${Number(analyticsRes.averages[key] || 0).toFixed(1)}`);
        });
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Top Holland Codes');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        hollandRes.slice(0, 10).forEach((row) => doc.text(`${row.hollandCode}: ${row.count}`));
        doc.moveDown(0.8);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Regional Completions');
        doc.fontSize(9).font('Helvetica').fillColor('#374151');
        regionalRes.forEach((row) => doc.text(`${row.region}: ${row.completedAssessments}`));
        doc.end();
        return;
      }

      const csvRows = [
        {
          section: 'summary',
          registeredUsers: analyticsRes.totalUsers,
          students: analyticsRes.studentCount,
          totalAssessments: analyticsRes.totalAssessments,
          completedAssessments: analyticsRes.completedAssessments,
          completionRate: analyticsRes.completionRate,
          avgR: Number(analyticsRes.averages.avgR || 0).toFixed(1),
          avgI: Number(analyticsRes.averages.avgI || 0).toFixed(1),
          avgA: Number(analyticsRes.averages.avgA || 0).toFixed(1),
          avgS: Number(analyticsRes.averages.avgS || 0).toFixed(1),
          avgE: Number(analyticsRes.averages.avgE || 0).toFixed(1),
          avgC: Number(analyticsRes.averages.avgC || 0).toFixed(1),
          institutionId: req.query.institutionId || '',
          institutionType: req.query.institutionType || '',
          region: req.query.region || '',
          userType: req.query.userType || '',
          startDate: req.query.startDate || '',
          endDate: req.query.endDate || ''
        },
        ...hollandRes.map((row) => ({ section: 'holland_distribution', hollandCode: row.hollandCode, count: row.count })),
        ...regionalRes.map((row) => ({ section: 'regional_completion', region: row.region, completedAssessments: row.completedAssessments }))
      ];

      const parser = new Parser();
      const csv = parser.parse(csvRows);
      res.header('Content-Type', 'text/csv');
      res.attachment('analytics_report.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  getSegmentationAnalytics: async (req, res, next) => {
    try {
      const { Op, fn, col } = require('sequelize');
      const { userWhere, assessmentWhere, userInclude } = buildAnalyticsFilters(req.query);

      const [riasecByGender, riasecByUserType, hollandByGender] = await Promise.all([
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed' },
          include: [{
            model: User, as: 'user', required: true, attributes: [],
            where: { ...userWhere, gender: { [Op.ne]: null } },
            include: userInclude
          }],
          attributes: [
            [col('user.gender'), 'gender'],
            [fn('COUNT', col('Assessment.id')), 'count'],
            [fn('AVG', col('Assessment.score_r')), 'avgR'],
            [fn('AVG', col('Assessment.score_i')), 'avgI'],
            [fn('AVG', col('Assessment.score_a')), 'avgA'],
            [fn('AVG', col('Assessment.score_s')), 'avgS'],
            [fn('AVG', col('Assessment.score_e')), 'avgE'],
            [fn('AVG', col('Assessment.score_c')), 'avgC'],
          ],
          group: [col('user.gender')],
          raw: true
        }),
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed' },
          include: [{
            model: User, as: 'user', required: true, attributes: [],
            where: { ...userWhere, userType: { [Op.ne]: null } },
            include: userInclude
          }],
          attributes: [
            [col('user.user_type'), 'userType'],
            [fn('COUNT', col('Assessment.id')), 'count'],
            [fn('AVG', col('Assessment.score_r')), 'avgR'],
            [fn('AVG', col('Assessment.score_i')), 'avgI'],
            [fn('AVG', col('Assessment.score_a')), 'avgA'],
            [fn('AVG', col('Assessment.score_s')), 'avgS'],
            [fn('AVG', col('Assessment.score_e')), 'avgE'],
            [fn('AVG', col('Assessment.score_c')), 'avgC'],
          ],
          group: [col('user.user_type')],
          raw: true
        }),
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
          include: [{
            model: User, as: 'user', required: true, attributes: [],
            where: { ...userWhere, gender: { [Op.ne]: null } },
            include: userInclude
          }],
          attributes: [
            [col('user.gender'), 'gender'],
            'hollandCode',
            [fn('COUNT', col('Assessment.id')), 'count']
          ],
          group: [col('user.gender'), 'Assessment.holland_code'],
          order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
          raw: true
        })
      ]);

      res.status(200).json({
        status: 'success',
        data: { riasecByGender, riasecByUserType, hollandByGender }
      });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get segmentation analytics', req, details: { error: error.message } });
      next(error);
    }
  },

  getSkillsPipeline: async (req, res, next) => {
    try {
      const { Op, fn, col } = require('sequelize');
      const { assessmentWhere, assessmentInclude } = buildAnalyticsFilters(req.query);

      const now = new Date();
      const currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      const priorStart = new Date(currentStart);
      priorStart.setDate(priorStart.getDate() - 30);

      const [currentDist, priorDist, allTimeDist, emergingCareers] = await Promise.all([
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null }, completedAt: { [Op.gte]: currentStart } },
          include: assessmentInclude,
          attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'count']],
          group: ['hollandCode'],
          raw: true
        }),
        Assessment.findAll({
          where: {
            ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null },
            completedAt: { [Op.gte]: priorStart, [Op.lt]: currentStart }
          },
          include: assessmentInclude,
          attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'count']],
          group: ['hollandCode'],
          raw: true
        }),
        Assessment.findAll({
          where: { ...assessmentWhere, status: 'completed', hollandCode: { [Op.ne]: null } },
          include: assessmentInclude,
          attributes: ['hollandCode', [fn('COUNT', col('Assessment.id')), 'count']],
          group: ['hollandCode'],
          order: [[fn('COUNT', col('Assessment.id')), 'DESC']],
          raw: true
        }),
        Occupation.findAll({
          where: { localDemand: { [Op.in]: ['critical', 'very_high', 'high'] } },
          attributes: ['name', 'primaryRiasec', 'localDemand', 'demandLevel', 'category'],
          order: [['name', 'ASC']],
          limit: 20,
          raw: true
        })
      ]);

      const priorMap = {};
      priorDist.forEach(d => { priorMap[d.hollandCode] = Number(d.count); });

      const hollandPipeline = currentDist.map(d => {
        const current = Number(d.count);
        const prior = priorMap[d.hollandCode] || 0;
        const growth = prior === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - prior) / prior) * 100);
        return { code: d.hollandCode, current, prior, growth };
      }).sort((a, b) => b.growth - a.growth);

      res.status(200).json({
        status: 'success',
        data: { hollandPipeline, allTimeDist, emergingCareers }
      });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get skills pipeline', req, details: { error: error.message } });
      next(error);
    }
  }
};

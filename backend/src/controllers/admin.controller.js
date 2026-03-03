const { User, AuditLog, Assessment } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

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
      logger.info({
        actionType: 'ADMIN_ACTION',
        message: 'Fetching system analytics',
        req,
        details: {
          adminId: req.user?.id
        }
      });

      const [studentCount, counselorCount] = await Promise.all([
        User.count({ where: { role: 'user' } }),
        User.count({ where: { role: 'counselor' } })
      ]);

      const totalAssessments = await Assessment.count();
      const completedAssessments = await Assessment.count({ where: { status: 'completed' } });
      const completionRate = totalAssessments === 0 ? 0 : (completedAssessments / totalAssessments) * 100;

      const averages = await Assessment.findOne({
        attributes: [
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_r')), 'avgR'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_i')), 'avgI'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_a')), 'avgA'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_s')), 'avgS'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_e')), 'avgE'],
          [Assessment.sequelize.fn('AVG', Assessment.sequelize.col('score_c')), 'avgC']
        ],
        raw: true
      });

      const totalUsers = await User.count();

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
      logger.info({
        actionType: 'ADMIN_ACTION',
        message: `Fetching audit log ${req.params.id}`,
        req,
        details: {
          adminId: req.user?.id
        }
      });
      
      const log = await AuditLog.findByPk(req.params.id);

      if (!log) {
        logger.warn({
          actionType: 'ADMIN_ACTION',
          message: `Audit log not found: ${req.params.id}`,
          req,
          details: {
            adminId: req.user?.id
          }
        });
        return res.status(404).json({
          status: 'error',
          message: 'Audit log not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { log }
      });
    } catch (error) {
      logger.error({
        actionType: 'ADMIN_ACTION_FAILED',
        message: `Failed to fetch audit log ${req.params.id}`,
        req,
        details: {
          error: error.message,
          stack: error.stack
        }
      });
      next(error);
    }
  }
};

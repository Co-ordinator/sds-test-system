const adminService = require('../services/admin.service');
const { AuditLog } = require('../models');
const logger = require('../utils/logger');
const { sendEmail } = require('../config/email.config');

module.exports = {
  getAllUsers: async (req, res, next) => {
    try {
      logger.info({ actionType: 'ADMIN_ACTION', message: 'Fetching users', req, details: { adminId: req.user?.id, filters: req.query } });
      const users = await adminService.getAllUsers(req.query);
      logger.info({ actionType: 'ADMIN_ACTION', message: `Fetched ${users.length} users`, req, details: { adminId: req.user?.id } });
      res.status(200).json({ status: 'success', results: users.length, data: { users } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to fetch users', req, details: { error: error.message, stack: error.stack } });
      next(error);
    }
  },

  getUser: async (req, res, next) => {
    try {
      logger.info({ actionType: 'ADMIN_ACTION', message: `Fetching user ${req.params.id}`, req, details: { adminId: req.user?.id } });
      const user = await adminService.getUser(req.params.id);
      if (!user) {
        logger.warn({ actionType: 'ADMIN_ACTION', message: `User not found: ${req.params.id}`, req, details: { adminId: req.user?.id } });
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
      res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: `Failed to fetch user ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      logger.info({ actionType: 'USER_DELETION', message: `Attempting to delete user ${req.params.id}`, req, details: { deletedBy: req.user?.id } });
      await adminService.deleteUser(req.params.id);
      await AuditLog.create({ userId: req.user?.id, actionType: 'USER_DELETED', description: 'User account deleted by admin', details: { resourceType: 'user', resourceId: req.params.id, requestMethod: req.method }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      logger.info({ actionType: 'USER_DELETION', message: `User deleted: ${req.params.id}`, req, details: { deletedBy: req.user?.id } });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') {
        logger.warn({ actionType: 'USER_DELETION', message: `User not found for deletion: ${req.params.id}`, req, details: { deletedBy: req.user?.id } });
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
      logger.error({ actionType: 'USER_DELETION_FAILED', message: `Failed to delete user ${req.params.id}`, req, details: { error: error.message, stack: error.stack } });
      next(error);
    }
  },

  getAuditLogs: async (req, res, next) => {
    try {
      const { logs, total } = await adminService.getAuditLogs(req.query);
      res.status(200).json({ status: 'success', total, results: logs.length, data: { logs } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to fetch audit logs', req, details: { error: error.message } });
      next(error);
    }
  },

  exportAuditLogs: async (req, res, next) => {
    try {
      const csv = await adminService.exportAuditLogs(req.query);
      res.header('Content-Type', 'text/csv');
      res.attachment('audit_logs_export.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export audit logs', req, details: { error: error.message } });
      next(error);
    }
  },

  getAuditLog: async (req, res, next) => {
    try {
      const log = await adminService.getAuditLog(req.params.id);
      if (!log) return res.status(404).json({ status: 'error', message: 'Audit log not found' });
      res.status(200).json({ status: 'success', data: { log } });
    } catch (error) {
      next(error);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      logger.info({ actionType: 'ADMIN_USER_UPDATE', message: `User ${req.params.id} updated`, req, details: { adminId: req.user?.id, updates: req.body } });
      res.status(200).json({ status: 'success', data: { user } });
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to update user', req, details: { error: error.message } });
      next(error);
    }
  },

  bulkDeleteUsers: async (req, res, next) => {
    try {
      const deleted = await adminService.bulkDeleteUsers(req.body.ids, req.user?.id);
      await AuditLog.create({ userId: req.user?.id, actionType: 'BULK_DELETE_USERS', description: `Bulk deleted ${deleted} users`, details: { ids: req.body.ids, count: deleted }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      logger.info({ actionType: 'BULK_DELETE_USERS', message: `Bulk deleted ${deleted} users`, req, details: { adminId: req.user?.id, count: deleted } });
      res.json({ status: 'success', data: { deleted } });
    } catch (error) {
      if (error.code === 'INVALID_BULK_IDS') return res.status(400).json({ status: 'error', message: error.message });
      logger.error({ actionType: 'BULK_DELETE_USERS_FAILED', message: 'Bulk delete users failed', req, details: { error: error.message } });
      next(error);
    }
  },

  bulkUpdateUsers: async (req, res, next) => {
    try {
      const updated = await adminService.bulkUpdateUsers(req.body.ids, req.body.updates);
      await AuditLog.create({ userId: req.user?.id, actionType: 'BULK_UPDATE_USERS', description: `Bulk updated ${updated} users`, details: { ids: req.body.ids, updates: req.body.updates, count: updated }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      logger.info({ actionType: 'BULK_UPDATE_USERS', message: `Bulk updated ${updated} users`, req, details: { adminId: req.user?.id, updates: req.body.updates, count: updated } });
      res.json({ status: 'success', data: { updated } });
    } catch (error) {
      if (error.code === 'INVALID_BULK_IDS' || error.code === 'NO_VALID_UPDATES') {
        return res.status(400).json({ status: 'error', message: error.message });
      }
      logger.error({ actionType: 'BULK_UPDATE_USERS_FAILED', message: 'Bulk update users failed', req, details: { error: error.message } });
      next(error);
    }
  },

  getAllAssessments: async (req, res, next) => {
    try {
      const { assessments, total } = await adminService.getAllAssessments(req.query);
      res.status(200).json({ status: 'success', results: assessments.length, total, data: { assessments } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to list assessments', req, details: { error: error.message } });
      next(error);
    }
  },

  exportUsers: async (req, res, next) => {
    try {
      const csv = await adminService.exportUsers(req.query);
      res.header('Content-Type', 'text/csv');
      res.attachment('users_export.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export users', req, details: { error: error.message } });
      next(error);
    }
  },

  exportAssessments: async (req, res, next) => {
    try {
      const csv = await adminService.exportAssessments(req.query);
      res.header('Content-Type', 'text/csv');
      res.attachment('assessments_export.csv');
      return res.status(200).send(csv);
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to export assessments', req, details: { error: error.message } });
      next(error);
    }
  },

  getNotifications: async (req, res, next) => {
    try {
      const { notifications, unreadCount } = await adminService.getNotifications(req.query.limit);
      res.status(200).json({ status: 'success', data: { notifications, unreadCount } });
    } catch (error) {
      logger.error({ actionType: 'ADMIN_ACTION_FAILED', message: 'Failed to get notifications', req, details: { error: error.message } });
      next(error);
    }
  },

  markNotificationRead: async (req, res, next) => {
    try {
      const log = await adminService.markNotificationRead(req.params.id);
      res.status(200).json({ status: 'success', data: { notification: log } });
    } catch (error) {
      if (error.code === 'NOTIFICATION_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  markAllNotificationsRead: async (req, res, next) => {
    try {
      await adminService.markAllNotificationsRead();
      res.status(200).json({ status: 'success', message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  },

  createUser: async (req, res, next) => {
    try {
      const { user, tempPassword, assignedRole } = await adminService.createUser(req.body);
      const roleLabel = assignedRole === 'Test Administrator' ? 'Test Administrator' : assignedRole === 'System Administrator' ? 'System Administrator' : 'Test Taker';
      
      try {
        await sendEmail({
          email: user.email,
          subject: `Welcome to SDS - Your ${roleLabel} Account`,
          template: 'user-welcome',
          context: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            tempPassword,
            role: roleLabel,
            loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
            organization: req.body.organization || 'SDS System'
          }
        });
      } catch (emailError) {
        logger.error({ actionType: 'EMAIL_FAILED', message: `Failed to send welcome email to ${user.email}`, req, details: { error: emailError.message } });
      }

      await AuditLog.create({
        userId: req.user?.id,
        actionType: 'USER_CREATED',
        description: `${roleLabel} account created: ${user.email}`,
        details: { resourceType: 'user', resourceId: user.id, role: assignedRole, requestMethod: req.method },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});

      logger.info({ actionType: 'USER_CREATED', message: `User created: ${user.email} (${assignedRole})`, req, details: { adminId: req.user?.id, newUserId: user.id } });

      res.status(201).json({
        status: 'success',
        message: `${roleLabel} created successfully. Login credentials sent to ${user.email}.`,
        data: { user: user.toJSON() }
      });
    } catch (error) {
      if (error.code === 'REQUIRED_FIELDS_MISSING' || error.code === 'INVALID_ROLE' || error.code === 'USER_ALREADY_EXISTS') {
        return res.status(400).json({ status: 'error', message: error.message });
      }
      logger.error({ actionType: 'USER_CREATION_FAILED', message: 'Failed to create user', req, details: { error: error.message, stack: error.stack } });
      next(error);
    }
  },

  getAllPermissions: async (req, res, next) => {
    try {
      const permissions = await adminService.getAllPermissions();
      res.status(200).json({ status: 'success', data: { permissions } });
    } catch (error) {
      next(error);
    }
  },

  getUserPermissions: async (req, res, next) => {
    try {
      const user = await adminService.getUserPermissions(req.params.id);
      res.status(200).json({ status: 'success', data: { user: user.toJSON() } });
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  updateUserPermissions: async (req, res, next) => {
    try {
      const updated = await adminService.updateUserPermissions(req.params.id, req.body.permissionIds);
      await AuditLog.create({
        userId: req.user?.id,
        actionType: 'PERMISSIONS_UPDATED',
        description: `Permissions updated for user ${updated.email}`,
        details: { resourceType: 'user', resourceId: updated.id, permissionCount: req.body.permissionIds?.length || 0, requestMethod: req.method },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {});
      res.status(200).json({ status: 'success', message: 'Permissions updated', data: { user: updated.toJSON() } });
    } catch (error) {
      if (error.code === 'USER_NOT_FOUND') return res.status(404).json({ status: 'error', message: error.message });
      next(error);
    }
  },

  getInstitutions: async (req, res, next) => {
    try {
      const institutions = await adminService.getInstitutions();
      res.status(200).json({ status: 'success', data: { institutions } });
    } catch (error) {
      next(error);
    }
  }
};

'use strict';

const { User, AuditLog, Assessment, Institution } = require('../models');
const { Op } = require('sequelize');
const { Parser } = require('json2csv');
const { parse } = require('csv-parse/sync');
const crypto = require('crypto');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors/appError');
const scoringService = require('./scoring.service');
const { permanentlyDeleteUser, permanentlyDeleteUsers } = require('./userDeletion.service');

const getAssessmentDisplayCode = (assessment) => {
  if (!assessment || (assessment.status !== 'completed' && !assessment.hollandCode)) return null;
  return scoringService.getAssessmentDisplayCode(assessment, assessment.hollandCode || null) || null;
};

const attachAssessmentDisplayCode = (assessment) => {
  assessment?.setDataValue?.('hollandCodeDisplay', getAssessmentDisplayCode(assessment));
  return assessment;
};

module.exports = {

  /* ─── User Management ─────────────────────────────────────────────────── */

  getAllUsers: async ({ role, educationLevel, education_level: educationLevelSnake, search }) => {
    const where = {};
    if (role) where.role = role;
    if (educationLevel || educationLevelSnake) where.educationLevel = educationLevel || educationLevelSnake;
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    return await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        { model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region'], required: false },
        { model: Institution, as: 'workplace', attributes: ['id', 'name'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      where
    });
  },

  getUser: async (id) => {
    return await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region'], required: false },
        { model: Institution, as: 'workplace', attributes: ['id', 'name'], required: false }
      ]
    });
  },

  updateUser: async (id, updates) => {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const allowed = ['role', 'institutionId', 'isActive', 'firstName', 'lastName', 'email'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }

    await user.update(safeUpdates);
    return await User.findByPk(user.id, { attributes: { exclude: ['password', 'passwordResetToken', 'refreshToken'] } });
  },

  deleteUser: async (id) => {
    return permanentlyDeleteUser(id);
  },

  bulkDeleteUsers: async (ids, currentUserId) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestError('ids array required', 'INVALID_BULK_IDS');
    const result = await permanentlyDeleteUsers(ids, { excludeUserId: currentUserId });
    return result.deleted;
  },

  bulkUpdateUsers: async (ids, updates) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new BadRequestError('ids array required', 'INVALID_BULK_IDS');
    const allowed = ['isActive', 'role'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates?.[key] !== undefined) safeUpdates[key] = updates[key];
    }
    if (Object.keys(safeUpdates).length === 0) throw new BadRequestError('No valid updates provided', 'NO_VALID_UPDATES');
    const [updated] = await User.update(safeUpdates, { where: { id: { [Op.in]: ids } } });
    return updated;
  },

  createUser: async ({ firstName, lastName, email, role, institutionId, organization, permissionIds }) => {
    if (!firstName || !lastName || !email) {
      throw new BadRequestError('First name, last name, and email are required', 'REQUIRED_FIELDS_MISSING');
    }

    const validRoles = ['System Administrator', 'Test Administrator', 'Test Taker'];
    if (role && !validRoles.includes(role)) {
      throw new BadRequestError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 'INVALID_ROLE');
    }

    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username: email }] } });
    if (existingUser) {
      throw new ConflictError('A user with this email already exists', 'USER_ALREADY_EXISTS');
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const assignedRole = role || 'Test Taker';

    const userFields = {
      firstName,
      lastName,
      email,
      username: email,
      password: tempPassword,
      role: assignedRole,
      userType: assignedRole === 'Test Administrator' ? 'Test Administrator' : assignedRole === 'System Administrator' ? 'System Administrator' : null,
      institutionId: institutionId || null,
      organization: organization || null,
      isEmailVerified: true,
      mustChangePassword: true,
      isActive: true,
      isConsentGiven: true,
      consentDate: new Date()
    };

    if (assignedRole === 'Test Administrator') {
      userFields.testAdministratorCode = `TA-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }

    // Admin-created Test Takers already have identity captured; no in-app onboarding wizard required
    if (assignedRole === 'Test Taker' && firstName && lastName) {
      userFields.onboardingCompleted = true;
    }

    const newUser = await User.create(userFields);

    // Assign permissions
    if (permissionIds && permissionIds.length > 0) {
      const { Permission, UserPermission } = require('../models');
      const validPerms = await Permission.findAll({ where: { id: permissionIds } });
      if (validPerms.length > 0) {
        await UserPermission.bulkCreate(
          validPerms.map(p => ({ userId: newUser.id, permissionId: p.id })),
          { ignoreDuplicates: true }
        );
      }
    } else if (assignedRole === 'System Administrator') {
      const { Permission, UserPermission } = require('../models');
      const allPerms = await Permission.findAll();
      if (allPerms.length > 0) {
        await UserPermission.bulkCreate(
          allPerms.map(p => ({ userId: newUser.id, permissionId: p.id })),
          { ignoreDuplicates: true }
        );
      }
    }

    // Re-fetch with permissions
    const created = await User.findByPk(newUser.id, {
      attributes: { exclude: ['password', 'passwordResetToken', 'refreshToken'] },
      include: [
        { model: Institution, as: 'institution', attributes: ['id', 'name', 'type', 'region'] },
        { model: require('../models').Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }
      ]
    });

    return { user: created, tempPassword, assignedRole };
  },

  importSystemAdmins: async (csvData) => {
    if (!csvData || typeof csvData !== 'string' || !csvData.trim()) {
      throw new BadRequestError('CSV data is required', 'CSV_REQUIRED');
    }

    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    if (records.length === 0) {
      throw new BadRequestError('No rows found in CSV', 'CSV_EMPTY');
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const firstName = String(row.first_name || row.firstName || '').trim();
      const lastName = String(row.last_name || row.lastName || '').trim();
      const email = String(row.email || '').trim().toLowerCase();
      const organization = String(row.organization || '').trim() || null;

      try {
        const result = await module.exports.createUser({
          firstName,
          lastName,
          email,
          role: 'System Administrator',
          organization
        });
        created.push(result);
      } catch (error) {
        errors.push({
          row: i + 2,
          email,
          message: error.message
        });
      }
    }

    return {
      createdCount: created.length,
      failedCount: errors.length,
      users: created.map((entry) => ({
        id: entry.user.id,
        email: entry.user.email,
        firstName: entry.user.firstName,
        lastName: entry.user.lastName
      })),
      credentials: created.map((entry) => ({
        email: entry.user.email,
        tempPassword: entry.tempPassword
      })),
      errors
    };
  },

  exportUsers: async ({ role, institutionId }) => {
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
    return parser.parse(rows);
  },

  /* ─── Audit Logs ──────────────────────────────────────────────────────── */

  getAuditLogs: async ({ actionType, userId, search, startDate, endDate, limit = 100, offset = 0 }) => {
    const where = {};
    if (actionType) where.actionType = actionType;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }
    if (search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { actionType: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { rows: logs, count: total } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', required: false, attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit), 500),
      offset: Number(offset)
    });

    return { logs, total };
  },

  getAuditLog: async (id) => {
    return await AuditLog.findByPk(id);
  },

  exportAuditLogs: async ({ actionType, userId, startDate, endDate }) => {
    const where = {};
    if (actionType) where.actionType = actionType;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt[Op.lte] = new Date(`${endDate}T23:59:59.999Z`);
    }

    const logs = await AuditLog.findAll({
      where,
      include: [{ model: User, as: 'user', required: false, attributes: ['firstName', 'lastName', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    const rows = logs.map(l => ({
      id: l.id,
      actionType: l.actionType,
      description: l.description,
      user: l.user ? `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() || l.user.email : '',
      ipAddress: l.ipAddress || '',
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : ''
    }));
    const parser = new Parser({ fields: ['id', 'actionType', 'description', 'user', 'ipAddress', 'createdAt'] });
    return parser.parse(rows);
  },

  /* ─── Assessments ─────────────────────────────────────────────────────── */

  getAllAssessments: async ({ status, institutionId, search, limit = 100, offset = 0 }) => {
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
        attributes: [
          'id', 'firstName', 'lastName', 'email', 'userType', 'institutionId',
          'currentInstitution', 'workplaceInstitutionId', 'workplaceName', 'region'
        ],
        include: [{ model: Institution, as: 'institution', attributes: ['id', 'name', 'region', 'type'] }]
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    const total = await Assessment.count({
      where,
      include: Object.keys(userWhere).length > 0 ? [{ model: User, as: 'user', required: true, where: userWhere }] : []
    });

    return { assessments: assessments.map(attachAssessmentDisplayCode), total };
  },

  exportAssessments: async ({ institutionId, status }) => {
    const where = {};
    if (status) where.status = status;

    const assessments = await Assessment.findAll({
      where,
      include: [{
        model: User, as: 'user', required: false,
        where: institutionId ? { institutionId } : {},
        attributes: [
          'firstName', 'lastName', 'email', 'userType', 'institutionId',
          'currentInstitution', 'workplaceInstitutionId', 'workplaceName'
        ],
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
      institution: a.user?.institution?.name || a.user?.currentInstitution || a.user?.workplaceName || '',
      status: a.status,
      hollandCode: getAssessmentDisplayCode(a) || a.hollandCode || '',
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
    return parser.parse(rows);
  },

  /* ─── Notifications ───────────────────────────────────────────────────── */

  getNotifications: async (limit = 50) => {
    const notifications = await AuditLog.findAll({
      where: { actionType: 'ASSESSMENT_COMPLETED_NOTIFY' },
      order: [['createdAt', 'DESC']],
      limit: Number(limit)
    });

    const unreadCount = await AuditLog.count({
      where: {
        actionType: 'ASSESSMENT_COMPLETED_NOTIFY',
        [Op.and]: [
          AuditLog.sequelize.literal("COALESCE((details->>'isRead')::boolean, false) = false")
        ]
      }
    });
    return { notifications, unreadCount };
  },

  markNotificationRead: async (id) => {
    const log = await AuditLog.findByPk(id);
    if (!log) throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND');
    const details = { ...(log.details || {}), isRead: true };
    await log.update({ details });
    return log;
  },

  markAllNotificationsRead: async () => {
    const [, metadata] = await AuditLog.sequelize.query(`
      UPDATE audit_logs
      SET details = COALESCE(details, '{}'::jsonb) || '{"isRead": true}'::jsonb
      WHERE action_type = 'ASSESSMENT_COMPLETED_NOTIFY'
        AND COALESCE((details->>'isRead')::boolean, false) = false
    `);
    return Number(metadata?.rowCount || 0);
  },

  /* ─── Permissions ─────────────────────────────────────────────────────── */

  getAllPermissions: async () => {
    const { Permission } = require('../models');
    return await Permission.findAll({ order: [['module', 'ASC'], ['code', 'ASC']] });
  },

  getUserPermissions: async (userId) => {
    const { Permission } = require('../models');
    const user = await User.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }]
    });
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    return user;
  },

  updateUserPermissions: async (userId, permissionIds) => {
    const { Permission, UserPermission } = require('../models');
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    await UserPermission.destroy({ where: { userId: user.id } });

    if (permissionIds && permissionIds.length > 0) {
      const validPerms = await Permission.findAll({ where: { id: permissionIds } });
      await UserPermission.bulkCreate(
        validPerms.map(p => ({ userId: user.id, permissionId: p.id })),
        { ignoreDuplicates: true }
      );
    }

    return await User.findByPk(user.id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      include: [{ model: Permission, as: 'permissions', attributes: ['id', 'code', 'name', 'module'], through: { attributes: [] } }]
    });
  },

  /* ─── Institutions ────────────────────────────────────────────────────── */

  getInstitutions: async () => {
    return await Institution.findAll({ order: [['name', 'ASC']] });
  }
};

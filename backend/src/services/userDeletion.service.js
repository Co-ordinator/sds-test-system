'use strict';

const fs = require('fs');
const path = require('path');
const { User } = require('../models');
const { NotFoundError } = require('../utils/errors/appError');

const QUALIFICATION_UPLOAD_DIR = path.resolve(__dirname, '../../uploads/qualifications');

const removeQualificationFiles = (filePaths) => {
  const failures = [];
  for (const storedPath of filePaths) {
    if (!storedPath) continue;
    const resolvedPath = path.resolve(storedPath);
    const isQualificationFile = resolvedPath.startsWith(`${QUALIFICATION_UPLOAD_DIR}${path.sep}`);
    if (!isQualificationFile || !fs.existsSync(resolvedPath)) continue;
    try {
      fs.unlinkSync(resolvedPath);
    } catch (error) {
      failures.push({ filePath: resolvedPath, error: error.message });
    }
  }
  return failures;
};

const permanentlyDeleteUsers = async (userIds, { excludeUserId } = {}) => {
  const requestedIds = [...new Set((userIds || []).filter(Boolean))];
  const safeIds = requestedIds.filter((id) => id !== excludeUserId);
  if (safeIds.length === 0) return { deleted: 0, snapshots: [], fileCleanupFailures: [] };

  const result = await User.sequelize.transaction(async (transaction) => {
    const replacements = { userIds: safeIds };
    const [snapshots] = await User.sequelize.query(
      `SELECT id, email, role
       FROM users
       WHERE id IN (:userIds)
       FOR UPDATE`,
      { replacements, transaction }
    );

    if (snapshots.length === 0) {
      return { deleted: 0, snapshots: [], qualificationFiles: [] };
    }

    const found = { userIds: snapshots.map((user) => user.id) };
    const [qualifications] = await User.sequelize.query(
      `SELECT file_path
       FROM user_qualifications
       WHERE user_id IN (:userIds)`,
      { replacements: found, transaction }
    );

    // Some restored environments are missing historical foreign keys, so the
    // full user-owned graph is removed explicitly instead of relying on CASCADE.
    const statements = [
      `UPDATE institutions SET submitted_by = NULL WHERE submitted_by IN (:userIds)`,
      `UPDATE occupations SET submitted_by = NULL WHERE submitted_by IN (:userIds)`,
      `UPDATE certificates SET generated_by = NULL WHERE generated_by IN (:userIds)`,
      `DELETE FROM certificates
       WHERE user_id IN (:userIds)
          OR assessment_id IN (SELECT id FROM assessments WHERE user_id IN (:userIds))`,
      `DELETE FROM answers
       WHERE assessment_id IN (SELECT id FROM assessments WHERE user_id IN (:userIds))`,
      `DELETE FROM audit_logs WHERE user_id IN (:userIds)`,
      `DELETE FROM user_permissions WHERE user_id IN (:userIds)`,
      `DELETE FROM user_qualifications WHERE user_id IN (:userIds)`,
      `DELETE FROM school_students WHERE user_id IN (:userIds)`,
      `DELETE FROM assessments WHERE user_id IN (:userIds)`,
      `DELETE FROM users WHERE id IN (:userIds)`
    ];

    for (const statement of statements) {
      await User.sequelize.query(statement, { replacements: found, transaction });
    }

    return {
      deleted: snapshots.length,
      snapshots,
      qualificationFiles: qualifications.map((row) => row.file_path).filter(Boolean)
    };
  });

  return {
    deleted: result.deleted,
    snapshots: result.snapshots,
    fileCleanupFailures: removeQualificationFiles(result.qualificationFiles)
  };
};

const permanentlyDeleteUser = async (userId) => {
  const result = await permanentlyDeleteUsers([userId]);
  if (result.deleted === 0) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  return {
    snapshot: result.snapshots[0],
    fileCleanupFailures: result.fileCleanupFailures
  };
};

module.exports = {
  permanentlyDeleteUser,
  permanentlyDeleteUsers,
  removeQualificationFiles
};

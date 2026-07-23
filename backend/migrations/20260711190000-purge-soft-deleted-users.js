"use strict";

const fs = require("fs");
const path = require("path");

const qualificationUploadDir = path.resolve(__dirname, "../uploads/qualifications");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const usersTable = await queryInterface.describeTable("users");
    if (!usersTable.deleted_at) return;

    const [qualificationFiles] = await queryInterface.sequelize.query(`
      SELECT uq.file_path
      FROM user_qualifications uq
      JOIN users u ON u.id = uq.user_id
      WHERE u.deleted_at IS NOT NULL
    `);

    for (const row of qualificationFiles) {
      if (!row.file_path) continue;
      const resolvedPath = path.resolve(row.file_path);
      const isQualificationFile = resolvedPath.startsWith(`${qualificationUploadDir}${path.sep}`);
      if (isQualificationFile && fs.existsSync(resolvedPath)) fs.unlinkSync(resolvedPath);
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const statements = [
        `UPDATE institutions SET submitted_by = NULL
         WHERE submitted_by IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `UPDATE occupations SET submitted_by = NULL
         WHERE submitted_by IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `UPDATE certificates SET generated_by = NULL
         WHERE generated_by IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `DELETE FROM certificates
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)
            OR assessment_id IN (
              SELECT a.id FROM assessments a
              JOIN users u ON u.id = a.user_id
              WHERE u.deleted_at IS NOT NULL
            )`,
        `DELETE FROM answers
         WHERE assessment_id IN (
           SELECT a.id FROM assessments a
           JOIN users u ON u.id = a.user_id
           WHERE u.deleted_at IS NOT NULL
         )`,
        `DELETE FROM audit_logs
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `DELETE FROM user_permissions
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `DELETE FROM user_qualifications
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `DELETE FROM school_students
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `DELETE FROM assessments
         WHERE user_id IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)`,
        `DELETE FROM users WHERE deleted_at IS NOT NULL`
      ];

      for (const statement of statements) {
        await queryInterface.sequelize.query(statement, options);
      }
    });
  },

  // A permanent account purge is intentionally irreversible.
  async down() {}
};

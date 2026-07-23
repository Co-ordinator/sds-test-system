"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      const options = { transaction };
      const statements = [
        `DELETE FROM certificates
         WHERE user_id NOT IN (SELECT id FROM users)
            OR assessment_id NOT IN (SELECT id FROM assessments)
            OR assessment_id IN (
              SELECT a.id
              FROM assessments a
              LEFT JOIN users u ON u.id = a.user_id
              WHERE u.id IS NULL
            )`,
        `DELETE FROM answers
         WHERE assessment_id NOT IN (SELECT id FROM assessments)
            OR assessment_id IN (
              SELECT a.id
              FROM assessments a
              LEFT JOIN users u ON u.id = a.user_id
              WHERE u.id IS NULL
            )`,
        `DELETE FROM audit_logs
         WHERE user_id IS NOT NULL
           AND user_id NOT IN (SELECT id FROM users)`,
        `DELETE FROM user_permissions
         WHERE user_id NOT IN (SELECT id FROM users)`,
        `DELETE FROM user_qualifications
         WHERE user_id NOT IN (SELECT id FROM users)`,
        `DELETE FROM school_students
         WHERE user_id NOT IN (SELECT id FROM users)`,
        `DELETE FROM assessments
         WHERE user_id NOT IN (SELECT id FROM users)`
      ];

      for (const statement of statements) {
        await queryInterface.sequelize.query(statement, options);
      }
    });
  },

  // Orphan cleanup is intentionally irreversible.
  async down() {}
};

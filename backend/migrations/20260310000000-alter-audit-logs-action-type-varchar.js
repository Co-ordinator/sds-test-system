"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TABLE audit_logs ALTER COLUMN action_type TYPE VARCHAR(100) USING action_type::VARCHAR;`
    );
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_audit_logs_action_type";`
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_audit_logs_action_type') THEN
          CREATE TYPE "enum_audit_logs_action_type" AS ENUM(
            'LOGIN','REGISTER','LOGOUT','TEST_START','TEST_COMPLETE',
            'PROFILE_UPDATE','PASSWORD_CHANGE','ACCESS_DENIED','SYSTEM'
          );
        END IF;
      END$$;
    `);
    await queryInterface.sequelize.query(
      `ALTER TABLE audit_logs ALTER COLUMN action_type TYPE "enum_audit_logs_action_type" USING action_type::"enum_audit_logs_action_type";`
    );
  }
};

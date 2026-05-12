"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("assessments");
    if (!table.holland_code_display) {
      await queryInterface.addColumn("assessments", "holland_code_display", {
        type: Sequelize.STRING(32),
        allowNull: true
      });
    }

    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS assessments_holland_code_display_idx
        ON assessments (holland_code_display);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS assessments_holland_code_display_idx;");
    const table = await queryInterface.describeTable("assessments");
    if (table.holland_code_display) {
      await queryInterface.removeColumn("assessments", "holland_code_display");
    }
  }
};

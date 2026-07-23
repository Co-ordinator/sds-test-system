"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("assessments");
    if (!table.certificate_profile_snapshot) {
      await queryInterface.addColumn("assessments", "certificate_profile_snapshot", {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "Non-sensitive certificate context captured when the assessment is first completed"
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("assessments");
    if (table.certificate_profile_snapshot) {
      await queryInterface.removeColumn("assessments", "certificate_profile_snapshot");
    }
  }
};

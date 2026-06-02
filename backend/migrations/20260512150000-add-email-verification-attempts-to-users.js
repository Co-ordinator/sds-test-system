"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");
    if (!table.email_verification_attempts) {
      await queryInterface.addColumn("users", "email_verification_attempts", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("users");
    if (table.email_verification_attempts) {
      await queryInterface.removeColumn("users", "email_verification_attempts");
    }
  }
};

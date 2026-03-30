"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "onboarding_completed", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.changeColumn("users", "first_name", {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.changeColumn("users", "last_name", {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.sequelize.query(`
      UPDATE users
      SET onboarding_completed = true
      WHERE role = 'Test Taker'
        AND COALESCE(TRIM(first_name), '') <> ''
        AND LOWER(TRIM(first_name)) NOT IN ('pending')
        AND COALESCE(TRIM(last_name), '') <> ''
        AND LOWER(TRIM(last_name)) NOT IN ('onboarding', 'user')
        AND user_type IS NOT NULL
        AND region IS NOT NULL
        AND COALESCE(TRIM(district), '') <> ''
    `);

    await queryInterface.addIndex("users", ["onboarding_completed"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("users", ["onboarding_completed"]);
    await queryInterface.removeColumn("users", "onboarding_completed");
    await queryInterface.changeColumn("users", "first_name", {
      type: Sequelize.STRING,
      allowNull: false
    });
    await queryInterface.changeColumn("users", "last_name", {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};

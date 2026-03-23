'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add funding_priority enum to courses table.
    // Reflects the Eswatini Government (SLAS) scholarship priority classification.
    // 'high'   – Government priority programme (funded locally or internationally)
    // 'medium' – Partially aligned with government needs
    // 'none'   – Not currently a government priority programme
    await queryInterface.addColumn('courses', 'funding_priority', {
      type: Sequelize.ENUM('high', 'medium', 'none'),
      allowNull: false,
      defaultValue: 'none'
    });

    await queryInterface.addIndex('courses', ['funding_priority']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('courses', ['funding_priority']);
    await queryInterface.removeColumn('courses', 'funding_priority');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_courses_funding_priority";');
  }
};

'use strict';

/**
 * Replace funding_priority ENUM (high/medium/none) with BOOLEAN.
 * true  = SLAS government priority programme
 * false = not a priority programme
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex('courses', ['funding_priority']);

    await queryInterface.addColumn('courses', 'funding_priority_new', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.sequelize.query(`
      UPDATE courses
      SET funding_priority_new = (funding_priority::text IN ('high', 'medium'))
    `);

    await queryInterface.removeColumn('courses', 'funding_priority');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_courses_funding_priority";');

    await queryInterface.renameColumn('courses', 'funding_priority_new', 'funding_priority');
    await queryInterface.addIndex('courses', ['funding_priority']);
  },

  async down() {
    throw new Error(
      'Cannot revert funding_priority to ENUM: use a database backup if you need the old schema.'
    );
  },
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('questions', 'question_code', {
      type: Sequelize.STRING(10),
      allowNull: true,
      comment: 'SDS question code e.g. R1, I12, SR1'
    });

    await queryInterface.addIndex('questions', ['question_code'], {
      unique: true,
      name: 'questions_question_code_unique'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('questions', 'questions_question_code_unique');
    await queryInterface.removeColumn('questions', 'question_code');
  }
};

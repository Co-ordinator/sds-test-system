"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("course_requirements", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "courses", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      minimum_grade: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "e.g. A, B, C, D, E or percentage like 50%"
      },
      is_mandatory: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    await queryInterface.addIndex("course_requirements", ["course_id"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("course_requirements");
  }
};

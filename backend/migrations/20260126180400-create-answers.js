"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("answers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      assessment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "assessments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      question_id: {
        type: Sequelize.UUID,
        allowNull: false
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false
      },
      section: {
        type: Sequelize.ENUM("activities", "competencies", "occupations", "self_estimates"),
        allowNull: false
      },
      riasec_type: {
        type: Sequelize.ENUM("R", "I", "A", "S", "E", "C"),
        allowNull: false
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

    await queryInterface.addIndex("answers", ["assessment_id", "question_id"], { unique: true });
    await queryInterface.addIndex("answers", ["question_id"]);
    await queryInterface.addIndex("answers", ["assessment_id"]);
    await queryInterface.addIndex("answers", ["section"]);
    await queryInterface.addIndex("answers", ["riasec_type"]);
    await queryInterface.addIndex("answers", ["assessment_id", "section"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("answers");
  }
};

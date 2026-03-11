"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("questions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "The question text as seen in the SDS booklet"
      },
      section: {
        type: Sequelize.ENUM("activities", "competencies", "occupations", "self_estimates"),
        allowNull: false,
        comment: "Mapped to Sections I through IV of the SDS"
      },
      riasec_type: {
        type: Sequelize.ENUM("R", "I", "A", "S", "E", "C"),
        allowNull: false,
        comment: "The Holland personality type this question measures"
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: "Used to maintain the sequence of the test"
      },
      question_code: {
        type: Sequelize.STRING(10),
        allowNull: true,
        unique: true,
        comment: "SDS question code e.g. R1, I12, SR1"
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

    await queryInterface.addIndex("questions", ["question_code"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("questions");
  }
};

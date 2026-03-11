"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("courses", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name_swati: {
        type: Sequelize.STRING,
        allowNull: true
      },
      qualification_type: {
        type: Sequelize.ENUM(
          "certificate",
          "diploma",
          "bachelor",
          "honours",
          "postgrad_diploma",
          "masters",
          "doctorate",
          "short_course",
          "tvet",
          "other"
        ),
        allowNull: false,
        defaultValue: "bachelor"
      },
      duration_years: {
        type: Sequelize.DECIMAL(3, 1),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      // RIASEC codes this course maps to (e.g. ['ISA', 'SAI'])
      riasec_codes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      // Suggested high school subjects for this course
      suggested_subjects: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      field_of_study: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_active: {
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

    await queryInterface.addIndex("courses", ["qualification_type"]);
    await queryInterface.addIndex("courses", ["field_of_study"]);
    await queryInterface.addIndex("courses", ["is_active"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("courses");
  }
};

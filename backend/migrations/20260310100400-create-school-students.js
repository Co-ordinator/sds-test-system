"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("school_students", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      institution_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "institutions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      student_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      grade: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "e.g. Form3, Form4, Form5, Grade 11, Grade 12"
      },
      class_name: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "e.g. A, B, C, Blue, Red"
      },
      academic_year: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "e.g. 2026"
      },
      login_card_printed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      login_card_printed_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex("school_students", ["user_id"], { unique: true });
    await queryInterface.addIndex("school_students", ["institution_id"]);
    await queryInterface.addIndex("school_students", ["student_number"]);
    await queryInterface.addIndex("school_students", ["grade"]);
    await queryInterface.addIndex("school_students", ["class_name"]);
    await queryInterface.addIndex("school_students", ["institution_id", "student_number"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("school_students");
  }
};

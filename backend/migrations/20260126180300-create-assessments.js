"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("assessments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      status: {
        type: Sequelize.ENUM("in_progress", "completed", "expired"),
        allowNull: false,
        defaultValue: "in_progress"
      },
      progress: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      score_r: { type: Sequelize.INTEGER, defaultValue: 0 },
      score_i: { type: Sequelize.INTEGER, defaultValue: 0 },
      score_a: { type: Sequelize.INTEGER, defaultValue: 0 },
      score_s: { type: Sequelize.INTEGER, defaultValue: 0 },
      score_e: { type: Sequelize.INTEGER, defaultValue: 0 },
      score_c: { type: Sequelize.INTEGER, defaultValue: 0 },
      holland_code: {
        type: Sequelize.STRING(3),
        allowNull: true
      },
      education_level_at_test: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "education_levels", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      completed_at: {
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

    await queryInterface.addIndex("assessments", ["user_id"]);
    await queryInterface.addIndex("assessments", ["status"]);
    await queryInterface.addIndex("assessments", ["completed_at"]);
    await queryInterface.addIndex("assessments", ["user_id", "status"]);
    await queryInterface.addIndex("assessments", ["holland_code"]);
    await queryInterface.addIndex("assessments", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("assessments");
  }
};

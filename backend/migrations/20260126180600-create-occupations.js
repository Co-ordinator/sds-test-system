"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("occupations", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      code: {
        type: Sequelize.STRING(3),
        allowNull: false,
        unique: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      holland_codes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true
      },
      primary_riasec: {
        type: Sequelize.STRING(1),
        allowNull: true
      },
      secondary_riasec: {
        type: Sequelize.STRING(1),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      education_level: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "education_levels", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      education_required: {
        type: Sequelize.STRING,
        allowNull: true
      },
      demand_level: {
        type: Sequelize.ENUM("low", "medium", "high", "very_high", "critical"),
        allowNull: true
      },
      available_in_eswatini: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      local_demand: {
        type: Sequelize.ENUM("low", "medium", "high", "critical"),
        allowNull: true
      },
      skills: {
        type: Sequelize.ARRAY(Sequelize.STRING),
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("occupations");
  }
};

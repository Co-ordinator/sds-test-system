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
        type: Sequelize.STRING(10),
        allowNull: true
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
      status: {
        type: Sequelize.ENUM("approved", "pending_review"),
        allowNull: false,
        defaultValue: "approved"
      },
      submitted_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
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

    await queryInterface.addIndex("occupations", ["status"]);
    await queryInterface.addIndex("occupations", ["submitted_by"]);
    await queryInterface.addIndex("occupations", ["name"], {
      unique: true,
      name: "occupations_name_unique"
    });

    await queryInterface.addConstraint("institutions", {
      fields: ["submitted_by"],
      type: "foreign key",
      name: "institutions_submitted_by_fkey",
      references: { table: "users", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    await queryInterface.addConstraint("users", {
      fields: ["current_occupation_id"],
      type: "foreign key",
      name: "users_current_occupation_id_fkey",
      references: { table: "occupations", field: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeConstraint("users", "users_current_occupation_id_fkey");
    } catch (_) {
      // Constraint may not exist in some dev DB states.
    }
    try {
      await queryInterface.removeConstraint("institutions", "institutions_submitted_by_fkey");
    } catch (_) {
      // Constraint may not exist in some dev DB states.
    }
    await queryInterface.dropTable("occupations");
  }
};

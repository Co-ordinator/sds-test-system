"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add status + submitted_by to occupations
    await queryInterface.addColumn("occupations", "status", {
      type: Sequelize.ENUM("approved", "pending_review"),
      allowNull: false,
      defaultValue: "approved"
    });
    await queryInterface.addColumn("occupations", "submitted_by", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    // 2. Add status + submitted_by to institutions
    await queryInterface.addColumn("institutions", "status", {
      type: Sequelize.ENUM("approved", "pending_review"),
      allowNull: false,
      defaultValue: "approved"
    });
    await queryInterface.addColumn("institutions", "submitted_by", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    // 3. Add current_occupation_id FK to users
    await queryInterface.addColumn("users", "current_occupation_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "occupations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });

    // 4. Relax occupation code: remove unique, allow null, widen to 10 chars for user-submitted
    try {
      await queryInterface.removeConstraint("occupations", "occupations_code_key");
    } catch (_) { /* constraint may not exist */ }
    await queryInterface.changeColumn("occupations", "code", {
      type: Sequelize.STRING(10),
      allowNull: true,
      unique: false
    });

    // 5. Add indexes
    await queryInterface.addIndex("occupations", ["status"]);
    await queryInterface.addIndex("occupations", ["submitted_by"]);
    await queryInterface.addIndex("institutions", ["status"]);
    await queryInterface.addIndex("institutions", ["submitted_by"]);
    await queryInterface.addIndex("users", ["current_occupation_id"]);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "current_occupation_id");
    await queryInterface.removeColumn("institutions", "submitted_by");
    await queryInterface.removeColumn("institutions", "status");
    await queryInterface.removeColumn("occupations", "submitted_by");
    await queryInterface.removeColumn("occupations", "status");

    // Clean up ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_occupations_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_institutions_status";');
  }
};

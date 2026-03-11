"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("audit_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      action_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      user_agent: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex("audit_logs", ["user_id"]);
    await queryInterface.addIndex("audit_logs", ["action_type"]);
    await queryInterface.addIndex("audit_logs", ["created_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("audit_logs");
  }
};

"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("course_institutions", {
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
      institution_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "institutions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      // Specific entry requirements overriding course defaults at this institution
      custom_requirements: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
        comment: "Institution-specific requirements override e.g. [{subject:'English',grade:'C'}]"
      },
      application_url: {
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

    await queryInterface.addIndex("course_institutions", ["course_id"]);
    await queryInterface.addIndex("course_institutions", ["institution_id"]);
    await queryInterface.addIndex("course_institutions", ["course_id", "institution_id"], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("course_institutions");
  }
};

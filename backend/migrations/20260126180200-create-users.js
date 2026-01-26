"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("uuid_generate_v4()"),
        primaryKey: true
      },
      is_consent_given: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      consent_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      username: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      national_id: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM("male", "female", "other", "prefer_not_to_say"),
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      region: {
        type: Sequelize.ENUM("hhohho", "manzini", "lubombo", "shiselweni"),
        allowNull: true
      },
      district: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      education_level: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "education_levels", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      current_institution: {
        type: Sequelize.STRING,
        allowNull: true
      },
      grade_level: {
        type: Sequelize.STRING,
        allowNull: true
      },
      employment_status: {
        type: Sequelize.ENUM("student", "employed", "unemployed", "self_employed", "other"),
        allowNull: true
      },
      current_occupation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      institution_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "institutions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      role: {
        type: Sequelize.ENUM("admin", "counselor", "user"),
        allowNull: false,
        defaultValue: "user"
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      is_email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_by_counselor: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email_verification_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      preferred_language: {
        type: Sequelize.ENUM("en", "ss"),
        allowNull: false,
        defaultValue: "en"
      },
      requires_accessibility: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      accessibility_needs: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password_reset_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.STRING,
        allowNull: true
      },
      refresh_token_expires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      counselor_code: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      organization: {
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

    await queryInterface.addIndex("users", ["username"], { unique: true });
    await queryInterface.addIndex("users", ["email"], { unique: true });
    await queryInterface.addIndex("users", ["national_id"], { unique: true });
    await queryInterface.addIndex("users", ["institution_id"]);
    await queryInterface.addIndex("users", ["role"]);
    await queryInterface.addIndex("users", ["education_level"]);
    await queryInterface.addIndex("users", ["is_active"]);
    await queryInterface.addIndex("users", ["is_email_verified"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  }
};

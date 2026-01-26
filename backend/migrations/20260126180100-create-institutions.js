"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("institutions", {
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
      acronym: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM("university", "college", "tvet", "school", "vocational", "other"),
        allowNull: false,
        defaultValue: "other"
      },
      region: {
        type: Sequelize.ENUM("hhohho", "manzini", "lubombo", "shiselweni", "multiple"),
        allowNull: true
      },
      district: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      description_swati: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phone_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true
      },
      accredited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      bursaries_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      programs: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: "[{ name, code, duration, riasecCodes[] }]"
      },
      facilities: {
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
    await queryInterface.dropTable("institutions");
  }
};

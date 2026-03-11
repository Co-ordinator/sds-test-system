"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add user_type enum
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_users_user_type" AS ENUM (
          'school_student', 'university_student', 'professional', 'counselor', 'admin'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryInterface.addColumn("users", "user_type", {
      type: Sequelize.ENUM("school_student", "university_student", "professional", "counselor", "admin"),
      allowNull: true
    });

    await queryInterface.addColumn("users", "student_number", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn("users", "class_name", {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("users", "student_code", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn("users", "degree_program", {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn("users", "year_of_study", {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn("users", "years_experience", {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addIndex("users", ["student_number"], {
      unique: true,
      where: { student_number: { [Sequelize.Op.ne]: null } }
    });
    await queryInterface.addIndex("users", ["student_code"], {
      unique: true,
      where: { student_code: { [Sequelize.Op.ne]: null } }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "user_type");
    await queryInterface.removeColumn("users", "student_number");
    await queryInterface.removeColumn("users", "class_name");
    await queryInterface.removeColumn("users", "student_code");
    await queryInterface.removeColumn("users", "degree_program");
    await queryInterface.removeColumn("users", "year_of_study");
    await queryInterface.removeColumn("users", "years_experience");
  }
};

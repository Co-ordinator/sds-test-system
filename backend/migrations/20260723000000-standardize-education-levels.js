'use strict';

const { CANONICAL_EDUCATION_LEVELS } = require('../src/utils/profileEducation');

const PREVIOUS_DESCRIPTIONS = {
  1: 'Lower than matric',
  2: 'High school education (matric)',
  3: 'Training at college/technical college/on-the-job-training',
  4: "Training at teachers' college/technikon/university",
  5: 'Postgraduate degree/university training plus experience'
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('qa_user_education_backfill', {
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          primaryKey: true
        },
        previous_education_level: {
          type: Sequelize.UUID,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      for (const [level, description] of Object.entries(CANONICAL_EDUCATION_LEVELS)) {
        await queryInterface.bulkUpdate(
          'education_levels',
          { description, updated_at: new Date() },
          { level: Number(level) },
          { transaction }
        );
      }

      await queryInterface.sequelize.query(`
        INSERT INTO qa_user_education_backfill (user_id, previous_education_level)
        SELECT id, education_level
        FROM users
        WHERE role = 'Test Taker'
          AND education_level IS NULL
          AND grade_level IN (
            'Lower Than High School',
            'High School Level',
            'A-Level',
            'IB Certificate',
            'Certificate / Diploma',
            'Bachelor''s Degree',
            'Postgraduate',
            'Form 3 (Junior Secondary)',
            'Form 5 / O-Level (Senior Secondary)',
            'Bachelor''s degree'
          )
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE users AS u
        SET education_level = e.id,
            updated_at = NOW()
        FROM education_levels AS e
        WHERE u.id IN (SELECT user_id FROM qa_user_education_backfill)
          AND e.level = CASE u.grade_level
            WHEN 'Lower Than High School' THEN 1
            WHEN 'Form 3 (Junior Secondary)' THEN 1
            WHEN 'High School Level' THEN 2
            WHEN 'A-Level' THEN 2
            WHEN 'IB Certificate' THEN 2
            WHEN 'Form 5 / O-Level (Senior Secondary)' THEN 2
            WHEN 'Certificate / Diploma' THEN 3
            WHEN 'Bachelor''s Degree' THEN 4
            WHEN 'Bachelor''s degree' THEN 4
            WHEN 'Postgraduate' THEN 5
          END
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        UPDATE users AS u
        SET education_level = b.previous_education_level,
            updated_at = NOW()
        FROM qa_user_education_backfill AS b
        WHERE u.id = b.user_id
      `, { transaction });

      for (const [level, description] of Object.entries(PREVIOUS_DESCRIPTIONS)) {
        await queryInterface.bulkUpdate(
          'education_levels',
          { description, updated_at: new Date() },
          { level: Number(level) },
          { transaction }
        );
      }
      await queryInterface.dropTable('qa_user_education_backfill', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('occupation_courses', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      occupation_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'occupations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      course_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      relevance_score: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Relevance score 0.00-1.00 indicating how well the course prepares for this occupation'
      },
      is_primary_pathway: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether this is a primary/direct pathway to the occupation'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes about this occupation-course relationship'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('occupation_courses', ['occupation_id']);
    await queryInterface.addIndex('occupation_courses', ['course_id']);
    await queryInterface.addIndex('occupation_courses', ['occupation_id', 'course_id'], {
      unique: true,
      name: 'occupation_courses_unique_pair'
    });
    await queryInterface.addIndex('occupation_courses', ['is_primary_pathway']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('occupation_courses');
  }
};

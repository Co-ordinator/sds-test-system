module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Assessments table
    await queryInterface.createTable('assessments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      status: {
        type: Sequelize.ENUM('in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'in_progress'
      },
      progress: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      score_r: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      score_i: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      score_a: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      score_s: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      score_e: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      score_c: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('assessments', ['user_id']);

    // Answers table
    await queryInterface.createTable('answers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      assessment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'assessments',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      section: {
        type: Sequelize.INTEGER, // 1-3 yes/no, 4-6 self-estimates
        allowNull: true
      },
      response_value: {
        type: Sequelize.ENUM('yes', 'no', '1', '2', '3', '4', '5', '6'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('answers', ['assessment_id']);
    await queryInterface.addIndex('answers', ['question_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('answers');
    await queryInterface.dropTable('assessments');
    // Clean up enums in Postgres
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_assessments_status\";");
      await queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_answers_response_value\";");
    }
  }
};

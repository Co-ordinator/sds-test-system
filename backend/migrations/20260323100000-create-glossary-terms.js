'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('glossary_terms', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      term: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      definition: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      section: {
        type: Sequelize.ENUM('riasec', 'structure', 'actions', 'occupations', 'activities', 'competencies', 'self_estimates', 'general'),
        allowNull: false,
        defaultValue: 'general',
      },
      example: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('glossary_terms', ['term']);
    await queryInterface.addIndex('glossary_terms', ['section']);
    await queryInterface.addIndex('glossary_terms', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('glossary_terms');
  },
};

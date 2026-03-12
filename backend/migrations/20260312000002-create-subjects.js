'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('subjects', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      riasec_codes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: []
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      level: {
        type: Sequelize.ENUM('high_school', 'tertiary', 'both'),
        defaultValue: 'high_school',
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
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

    await queryInterface.addIndex('subjects', ['riasec_codes'], {
      using: 'GIN'
    });
    await queryInterface.addIndex('subjects', ['is_active']);
    await queryInterface.addIndex('subjects', ['level']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('subjects');
  }
};

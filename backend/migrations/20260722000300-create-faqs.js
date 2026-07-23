'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('faqs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      question: { type: Sequelize.TEXT, allowNull: false },
      answer: { type: Sequelize.TEXT, allowNull: false },
      category: { type: Sequelize.STRING(64), allowNull: true },
      status: {
        type: Sequelize.ENUM('draft', 'published'),
        allowNull: false,
        defaultValue: 'draft'
      },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL'
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('faqs', ['status']);
    await queryInterface.addIndex('faqs', ['sort_order']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('faqs');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_faqs_status"');
  }
};

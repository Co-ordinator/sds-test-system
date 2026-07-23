'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('users', 'login_card_credential_nonce', {
        type: Sequelize.STRING(64),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn('users', 'login_card_password_issued_at', {
        type: Sequelize.DATE,
        allowNull: true,
      }, { transaction });
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('users', 'login_card_password_issued_at', { transaction });
      await queryInterface.removeColumn('users', 'login_card_credential_nonce', { transaction });
    });
  },
};

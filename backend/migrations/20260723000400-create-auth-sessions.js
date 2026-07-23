'use strict';

/**
 * Stores refresh-token families per browser/device instead of on the user row.
 * This allows the same account to be used by multiple authorised devices
 * without a later login invalidating every earlier session.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables.map((table) => (
      typeof table === 'string' ? table : table.tableName || table.table_name
    ));
    if (normalizedTables.includes('auth_sessions')) return;

    await queryInterface.createTable('auth_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      refresh_token_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true
      },
      previous_refresh_token_hash: {
        type: Sequelize.STRING(64),
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      previous_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_used_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('auth_sessions', ['user_id'], {
      name: 'auth_sessions_user_id_idx'
    });
    await queryInterface.addIndex('auth_sessions', ['expires_at'], {
      name: 'auth_sessions_expires_at_idx'
    });
    await queryInterface.addIndex('auth_sessions', ['revoked_at'], {
      name: 'auth_sessions_revoked_at_idx'
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    const normalizedTables = tables.map((table) => (
      typeof table === 'string' ? table : table.tableName || table.table_name
    ));
    if (normalizedTables.includes('auth_sessions')) {
      await queryInterface.dropTable('auth_sessions');
    }
  }
};

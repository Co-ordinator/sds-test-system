'use strict';

module.exports = (sequelize, DataTypes) => {
  const AuthSession = sequelize.define('AuthSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    refreshTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'refresh_token_hash'
    },
    previousRefreshTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'previous_refresh_token_hash'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    previousExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'previous_expires_at'
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_used_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    }
  }, {
    tableName: 'auth_sessions',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['expires_at'] },
      { fields: ['revoked_at'] }
    ]
  });

  AuthSession.associate = (models) => {
    AuthSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return AuthSession;
};

const { DataTypes } = require('sequelize');

const ACTION_TYPES = [
  'LOGIN',
  'REGISTER',
  'LOGOUT',
  'TEST_START',
  'TEST_COMPLETE',
  'PROFILE_UPDATE',
  'PASSWORD_CHANGE',
  'ACCESS_DENIED',
  'SYSTEM'
];

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actionType: {
      type: DataTypes.ENUM(...ACTION_TYPES),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    details: {
      type: DataTypes.JSONB
    },
    ipAddress: {
      type: DataTypes.STRING
    },
    userAgent: {
      type: DataTypes.STRING
    }
  }, {
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action_type'] },
      { fields: ['created_at'] }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AuditLog;
};

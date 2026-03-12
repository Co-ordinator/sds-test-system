module.exports = (sequelize, DataTypes) => {
  const UserPermission = sequelize.define('UserPermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id',
      references: { model: 'permissions', key: 'id' }
    }
  }, {
    tableName: 'user_permissions',
    timestamps: true,
    underscored: true
  });

  return UserPermission;
};

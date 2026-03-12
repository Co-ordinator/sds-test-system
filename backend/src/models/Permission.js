module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    module: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    underscored: true
  });

  Permission.associate = (models) => {
    Permission.belongsToMany(models.User, {
      through: models.UserPermission,
      foreignKey: 'permissionId',
      otherKey: 'userId',
      as: 'users'
    });
  };

  return Permission;
};

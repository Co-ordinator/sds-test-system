module.exports = (sequelize, DataTypes) => {
  const EducationLevel = sequelize.define('EducationLevel', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'education_levels',
    underscored: true
  });

  EducationLevel.associate = (models) => {
    EducationLevel.hasMany(models.Occupation, {
      foreignKey: 'educationLevel',
      sourceKey: 'id',
      as: 'occupations'
    });
    EducationLevel.hasMany(models.User, {
      foreignKey: 'educationLevel',
      sourceKey: 'id',
      as: 'users'
    });
  };

  return EducationLevel;
};

module.exports = (sequelize, DataTypes) => {
  const EducationLevel = sequelize.define('EducationLevel', {
    level: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
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
      sourceKey: 'level',
      as: 'occupations'
    });
    EducationLevel.hasMany(models.User, {
      foreignKey: 'educationLevel',
      sourceKey: 'level',
      as: 'users'
    });
  };

  return EducationLevel;
};

module.exports = (sequelize, DataTypes) => {
  const Occupation = sequelize.define('Occupation', {
    code: { type: DataTypes.STRING(3), allowNull: false }, // Holland 3-letter code e.g., 'RAC'
    name: { type: DataTypes.STRING, allowNull: false },
    hollandCodes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    primaryRiasec: { type: DataTypes.STRING(1), allowNull: true },
    secondaryRiasec: { type: DataTypes.STRING(1), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    educationLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'education_level',
      references: {
        model: 'education_levels',
        key: 'level'
      }
    },
    educationRequired: { type: DataTypes.STRING, allowNull: true },
    demandLevel: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'very_high', 'critical'),
      allowNull: true,
      field: 'demand_level'
    },
    availableInEswatini: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'available_in_eswatini'
    },
    localDemand: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: true,
      field: 'local_demand'
    },
    skills: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true }
  }, {
    tableName: 'occupations',
    underscored: true
  });

  Occupation.associate = (models) => {
    Occupation.belongsTo(models.EducationLevel, {
      foreignKey: 'educationLevel',
      targetKey: 'level',
      as: 'education'
    });
  };

  return Occupation;
};

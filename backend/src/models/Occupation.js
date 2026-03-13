module.exports = (sequelize, DataTypes) => {
  const Occupation = sequelize.define('Occupation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    code: { type: DataTypes.STRING(10), allowNull: true }, // Holland 3-letter code e.g., 'RAC'; nullable for user-submitted occupations
    name: { type: DataTypes.STRING, allowNull: false },
    hollandCodes: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    primaryRiasec: { type: DataTypes.STRING(1), allowNull: true },
    secondaryRiasec: { type: DataTypes.STRING(1), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    educationLevel: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'education_level',
      references: {
        model: 'education_levels',
        key: 'id'
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
    skills: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
    status: {
      type: DataTypes.ENUM('approved', 'pending_review'),
      allowNull: false,
      defaultValue: 'approved'
    },
    submittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'submitted_by'
    }
  }, {
    tableName: 'occupations',
    underscored: true,
    timestamps: true
  });

  Occupation.associate = (models) => {
    Occupation.belongsTo(models.EducationLevel, {
      foreignKey: 'educationLevel',
      targetKey: 'id',
      as: 'education'
    });
    Occupation.belongsTo(models.User, {
      foreignKey: 'submittedBy',
      as: 'submitter'
    });
    Occupation.hasMany(models.User, {
      foreignKey: 'currentOccupationId',
      as: 'users'
    });
    Occupation.belongsToMany(models.Course, {
      through: models.OccupationCourse,
      foreignKey: 'occupationId',
      otherKey: 'courseId',
      as: 'courses'
    });
    Occupation.hasMany(models.OccupationCourse, {
      foreignKey: 'occupationId',
      as: 'occupationCourses'
    });
  };

  return Occupation;
};

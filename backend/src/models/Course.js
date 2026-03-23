module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nameSwati: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'name_swati'
    },
    qualificationType: {
      type: DataTypes.ENUM(
        'certificate', 'diploma', 'bachelor', 'honours',
        'postgrad_diploma', 'masters', 'doctorate', 'short_course', 'tvet', 'other'
      ),
      allowNull: false,
      defaultValue: 'bachelor',
      field: 'qualification_type'
    },
    durationYears: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
      field: 'duration_years'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    riasecCodes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'riasec_codes'
    },
    suggestedSubjects: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
      field: 'suggested_subjects'
    },
    fieldOfStudy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'field_of_study'
    },
    fundingPriority: {
      type: DataTypes.ENUM('high', 'medium', 'none'),
      allowNull: false,
      defaultValue: 'none',
      field: 'funding_priority'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'courses',
    underscored: true,
    timestamps: true
  });

  Course.associate = (models) => {
    Course.hasMany(models.CourseRequirement, {
      foreignKey: 'courseId',
      as: 'requirements',
      onDelete: 'CASCADE'
    });
    Course.belongsToMany(models.Institution, {
      through: models.CourseInstitution,
      foreignKey: 'courseId',
      otherKey: 'institutionId',
      as: 'institutions'
    });
    Course.hasMany(models.CourseInstitution, {
      foreignKey: 'courseId',
      as: 'courseInstitutions'
    });
    Course.belongsToMany(models.Occupation, {
      through: models.OccupationCourse,
      foreignKey: 'courseId',
      otherKey: 'occupationId',
      as: 'occupations'
    });
    Course.hasMany(models.OccupationCourse, {
      foreignKey: 'courseId',
      as: 'occupationCourses'
    });
  };

  return Course;
};

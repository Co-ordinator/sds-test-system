module.exports = (sequelize, DataTypes) => {
  const CourseInstitution = sequelize.define('CourseInstitution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'course_id',
      references: { model: 'courses', key: 'id' }
    },
    institutionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'institution_id',
      references: { model: 'institutions', key: 'id' }
    },
    customRequirements: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      field: 'custom_requirements'
    },
    applicationUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'application_url'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'course_institutions',
    underscored: true,
    timestamps: true
  });

  CourseInstitution.associate = (models) => {
    CourseInstitution.belongsTo(models.Course, { foreignKey: 'courseId', as: 'course' });
    CourseInstitution.belongsTo(models.Institution, { foreignKey: 'institutionId', as: 'institution' });
  };

  return CourseInstitution;
};

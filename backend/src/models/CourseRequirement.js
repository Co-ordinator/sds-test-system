module.exports = (sequelize, DataTypes) => {
  const CourseRequirement = sequelize.define('CourseRequirement', {
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
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    minimumGrade: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'minimum_grade'
    },
    isMandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_mandatory'
    }
  }, {
    tableName: 'course_requirements',
    underscored: true
  });

  CourseRequirement.associate = (models) => {
    CourseRequirement.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });
  };

  return CourseRequirement;
};

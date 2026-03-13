module.exports = (sequelize, DataTypes) => {
  const OccupationCourse = sequelize.define('OccupationCourse', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    occupationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'occupation_id',
      references: {
        model: 'occupations',
        key: 'id'
      }
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'course_id',
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    relevanceScore: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      field: 'relevance_score'
    },
    isPrimaryPathway: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_primary_pathway'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'occupation_courses',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['occupation_id'] },
      { fields: ['course_id'] },
      { fields: ['occupation_id', 'course_id'], unique: true },
      { fields: ['is_primary_pathway'] }
    ]
  });

  OccupationCourse.associate = (models) => {
    OccupationCourse.belongsTo(models.Occupation, {
      foreignKey: 'occupationId',
      as: 'occupation'
    });
    OccupationCourse.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });
  };

  return OccupationCourse;
};

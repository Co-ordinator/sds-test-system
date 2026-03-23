module.exports = (sequelize, DataTypes) => {
  const Assessment = sequelize.define('Assessment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'expired'), // Added 'expired' for history
      allowNull: false,
      defaultValue: 'in_progress'
    },
    progress: {
      type: DataTypes.DECIMAL(5, 2), // Supports the 65% progress bar
      allowNull: false,
      defaultValue: 0
    },
    // Raw RIASEC Totals
    scoreR: { type: DataTypes.INTEGER, defaultValue: 0 },
    scoreI: { type: DataTypes.INTEGER, defaultValue: 0 },
    scoreA: { type: DataTypes.INTEGER, defaultValue: 0 },
    scoreS: { type: DataTypes.INTEGER, defaultValue: 0 },
    scoreE: { type: DataTypes.INTEGER, defaultValue: 0 },
    scoreC: { type: DataTypes.INTEGER, defaultValue: 0 },
    
    // The 3-letter Holland Code (e.g., "RIA") for the Results table
    hollandCode: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    
    // Captured at the time of test to ensure historical accuracy
    educationLevelAtTest: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'education_level_at_test',
      references: {
        model: 'education_levels',
        key: 'id'
      },
      comment: "Levels 1-5 from SDS Appendix"
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    }
  }, {
    tableName: 'assessments',
    underscored: true,
    timestamps: true, // Enables "Last accessed on" logic
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['completed_at'] },
      { fields: ['user_id', 'status'] },
      { fields: ['holland_code'] },
      { fields: ['created_at'] }
    ]
  });

  Assessment.associate = (models) => {
    Assessment.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Assessment.hasMany(models.Answer, { foreignKey: 'assessmentId', as: 'answers', onDelete: 'CASCADE' });
    Assessment.belongsTo(models.EducationLevel, { 
      foreignKey: 'educationLevelAtTest', 
      targetKey: 'id',
      as: 'educationLevel' 
    });
  };

  return Assessment;
};
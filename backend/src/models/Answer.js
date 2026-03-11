module.exports = (sequelize, DataTypes) => {
  const Answer = sequelize.define('Answer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    assessmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'assessment_id'
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'question_id'
    },
    // Handles 'YES'/'NO' or strings '1'-'6' for self-estimates
    value: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isValidAnswer(value) {
          const valid = ['YES', 'NO', '1', '2', '3', '4', '5', '6'];
          if (!valid.includes(value)) {
            throw new Error('Invalid answer value. Must be YES, NO, or 1-6');
          }
        }
      }
    },
    // Categorization to make scoring queries faster
    section: {
      type: DataTypes.ENUM('activities', 'competencies', 'occupations', 'self_estimates'),
      allowNull: false
    },
    riasecType: {
      type: DataTypes.ENUM('R', 'I', 'A', 'S', 'E', 'C'),
      allowNull: false,
      field: 'riasec_type'
    }
  }, {
    tableName: 'answers',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['assessment_id', 'question_id'], unique: true },
      { fields: ['question_id'] },
      { fields: ['assessment_id'] },
      { fields: ['section'] },
      { fields: ['riasec_type'] },
      { fields: ['assessment_id', 'section'] }
    ]
  });

  Answer.associate = (models) => {
    Answer.belongsTo(models.Assessment, {
      foreignKey: 'assessmentId',
      as: 'assessment',
      onDelete: 'CASCADE'
    });
  };

  return Answer;
};
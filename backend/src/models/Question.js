module.exports = (sequelize, DataTypes) => {
  const Question = sequelize.define('Question', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'The question text as seen in the SDS booklet'
    },
    section: {
      type: DataTypes.ENUM('activities', 'competencies', 'occupations', 'self_estimates'),
      allowNull: false,
      comment: 'Mapped to Sections I through IV of the SDS'
    },
    riasecType: {
      type: DataTypes.ENUM('R', 'I', 'A', 'S', 'E', 'C'),
      allowNull: false,
      field: 'riasec_type',
      comment: 'The Holland personality type this question measures'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Used to maintain the sequence of the test'
    }
  }, {
    tableName: 'questions',
    underscored: true,
    timestamps: false // Static question bank doesn't usually need timestamps
  });

  Question.associate = (models) => {
    // A Question can have many Answers across different Assessments
    Question.hasMany(models.Answer, {
      foreignKey: 'questionId',
      as: 'answers'
    });
  };

  return Question;
};

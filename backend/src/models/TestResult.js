const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestResult = sequelize.define('TestResult', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    attemptId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'test_attempts',
        key: 'id'
      }
    },
    realisticScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    investigativeScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    artisticScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    socialScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    enterprisingScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    conventionalScore: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    hollandCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    primaryInterest: {
      type: DataTypes.STRING,
      allowNull: false
    },
    secondaryInterest: {
      type: DataTypes.STRING,
      allowNull: false
    },
    tertiaryInterest: {
      type: DataTypes.STRING,
      allowNull: false
    },
    consistencyScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    profileDifferentiation: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    interpretation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reportUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    counselorNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'test_results',
    timestamps: true,
    underscored: true
  });

  TestResult.associate = (models) => {
    TestResult.belongsTo(models.TestAttempt, {
      foreignKey: 'attemptId',
      as: 'attempt'
    });
    
    TestResult.hasMany(models.OccupationRecommendation, {
      foreignKey: 'resultId',
      as: 'recommendations'
    });
  };

  return TestResult;
};

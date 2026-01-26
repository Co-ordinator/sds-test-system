const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestAttempt = sequelize.define('TestAttempt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    testId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'abandoned'),
      defaultValue: 'not_started'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    currentSection: {
      type: DataTypes.STRING,
      allowNull: true
    },
    progressPercentage: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    tableName: 'test_attempts',
    timestamps: true,
    underscored: true
  });

  TestAttempt.associate = (models) => {
    TestAttempt.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    TestAttempt.hasMany(models.TestResponse, {
      foreignKey: 'attemptId',
      as: 'responses'
    });
    
    TestAttempt.hasOne(models.TestResult, {
      foreignKey: 'attemptId',
      as: 'result'
    });
  };

  return TestAttempt;
};

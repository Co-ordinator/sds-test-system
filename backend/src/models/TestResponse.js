const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestResponse = sequelize.define('TestResponse', {
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
    questionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    responseValue: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    responseScore: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isModified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    modificationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'test_responses',
    timestamps: true,
    underscored: true
  });

  TestResponse.associate = (models) => {
    TestResponse.belongsTo(models.TestAttempt, {
      foreignKey: 'attemptId',
      as: 'attempt'
    });
  };

  return TestResponse;
};

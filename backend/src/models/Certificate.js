module.exports = (sequelize, DataTypes) => {
  const Certificate = sequelize.define('Certificate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    assessmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'assessment_id'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'generated_by'
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'generated_at'
    },
    certNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'cert_number'
    }
  }, {
    tableName: 'certificates',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['assessment_id'], unique: true },
      { fields: ['user_id'] },
      { fields: ['generated_at'] }
    ]
  });

  Certificate.associate = (models) => {
    Certificate.belongsTo(models.Assessment, { foreignKey: 'assessmentId', as: 'assessment' });
    Certificate.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Certificate;
};

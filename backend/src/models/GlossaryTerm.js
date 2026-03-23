module.exports = (sequelize, DataTypes) => {
  const GlossaryTerm = sequelize.define('GlossaryTerm', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    term: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    definition: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    section: {
      type: DataTypes.ENUM('activities', 'competencies', 'occupations', 'self_estimates', 'general'),
      allowNull: false,
      defaultValue: 'general',
    },
    example: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  }, {
    tableName: 'glossary_terms',
    underscored: true,
    timestamps: true,
  });

  return GlossaryTerm;
};

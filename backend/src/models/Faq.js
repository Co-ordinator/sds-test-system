module.exports = (sequelize, DataTypes) => {
  const Faq = sequelize.define('Faq', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    answer: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true }
    },
    category: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    }
  }, {
    tableName: 'faqs',
    underscored: true,
    timestamps: true
  });

  Faq.associate = (models) => {
    Faq.belongsTo(models.User, { foreignKey: 'createdBy', as: 'author' });
  };

  return Faq;
};

module.exports = (sequelize, DataTypes) => {
  const Subject = sequelize.define('Subject', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    riasecCodes: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      field: 'riasec_codes',
      validate: {
        isValidRiasec(value) {
          const validCodes = ['R', 'I', 'A', 'S', 'E', 'C'];
          if (value && value.length > 0) {
            value.forEach(code => {
              if (!validCodes.includes(code)) {
                throw new Error(`Invalid RIASEC code: ${code}`);
              }
            });
          }
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    level: {
      type: DataTypes.ENUM('high_school', 'tertiary', 'both'),
      defaultValue: 'high_school',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      field: 'is_active'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      field: 'display_order'
    }
  }, {
    tableName: 'subjects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['level'] },
      { fields: ['display_order'] }
    ]
  });

  return Subject;
};

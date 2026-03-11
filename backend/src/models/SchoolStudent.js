module.exports = (sequelize, DataTypes) => {
  const SchoolStudent = sequelize.define('SchoolStudent', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    institutionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'institution_id',
      references: { model: 'institutions', key: 'id' }
    },
    studentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'student_number'
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: true
    },
    className: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'class_name'
    },
    academicYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'academic_year'
    },
    loginCardPrinted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'login_card_printed'
    },
    loginCardPrintedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'login_card_printed_at'
    }
  }, {
    tableName: 'school_students',
    underscored: true
  });

  SchoolStudent.associate = (models) => {
    SchoolStudent.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    SchoolStudent.belongsTo(models.Institution, { foreignKey: 'institutionId', as: 'institution' });
  };

  return SchoolStudent;
};

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserQualification = sequelize.define('UserQualification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentType: {
      type: DataTypes.ENUM(
        'certificate',
        'degree',
        'diploma',
        'transcript',
        'professional_licence',
        'other'
      ),
      allowNull: false,
      defaultValue: 'certificate',
      field: 'document_type'
    },
    issuedBy: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'issued_by'
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'issue_date'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_name'
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'file_path'
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'file_size'
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'mime_type'
    }
  }, {
    tableName: 'user_qualifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] }
    ]
  });

  UserQualification.associate = (models) => {
    UserQualification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserQualification;
};

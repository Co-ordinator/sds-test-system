module.exports = (sequelize, DataTypes) => {
  const Institution = sequelize.define('Institution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nameSwati: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'name_swati'
    },
    acronym: {
      type: DataTypes.STRING,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('university', 'college', 'tvet', 'school', 'vocational', 'other'),
      allowNull: false,
      defaultValue: 'other'
    },
    region: {
      type: DataTypes.ENUM('hhohho', 'manzini', 'lubombo', 'shiselweni', 'multiple'),
      allowNull: true
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    descriptionSwati: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description_swati'
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_number'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    accredited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bursariesAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'bursaries_available'
    },
    programs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Expected format: [{ name: string, code: string, duration: string, riasecCodes: string[] }]'
    },
    facilities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    }
  }, {
    tableName: 'institutions',
    underscored: true
  });

  Institution.associate = (models) => {
    Institution.hasMany(models.User, {
      foreignKey: 'institutionId',
      as: 'users'
    });
    Institution.belongsToMany(models.Course, {
      through: models.CourseInstitution,
      foreignKey: 'institutionId',
      otherKey: 'courseId',
      as: 'courses'
    });
    Institution.hasMany(models.CourseInstitution, {
      foreignKey: 'institutionId',
      as: 'courseInstitutions'
    });
    Institution.hasMany(models.SchoolStudent, {
      foreignKey: 'institutionId',
      as: 'schoolStudents'
    });
  };

  return Institution;
};

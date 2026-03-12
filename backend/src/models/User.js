const bcrypt = require('bcryptjs');

// Helper function to parse national ID
const parseNationalId = (nationalId) => {
  if (!nationalId || nationalId.length !== 13) return null;
  
  // Extract date parts (first 6 digits: YYMMDD)
  const yy = parseInt(nationalId.substring(0, 2));
  const mm = parseInt(nationalId.substring(2, 4)) - 1; // JS months are 0-indexed
  const dd = parseInt(nationalId.substring(4, 6));
  
  // Determine century (YY > current year = 19xx, else 20xx)
  const currentYearShort = new Date().getFullYear() % 100;
  const century = yy > currentYearShort ? 1900 : 2000;
  const fullYear = century + yy;
  
  // Extract gender digits (positions 7-10)
  const genderDigits = parseInt(nationalId.substring(6, 10));
  const gender = genderDigits < 5000 ? 'female' : 'male';
  
  return {
    dateOfBirth: new Date(fullYear, mm, dd).toISOString().split('T')[0],
    gender
  };
};

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Consent Tracking
    isConsentGiven: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_consent_given'
    },
    consentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'consent_date'
    },
    
    // Authentication
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    
    // Personal Information
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'last_name'
    },
    nationalId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'national_id',
      validate: {
        len: [13, 13],
        isNumeric: true
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone_number'
    },
    
    // Address Information
    region: {
      type: DataTypes.ENUM('hhohho', 'manzini', 'lubombo', 'shiselweni'),
      allowNull: true
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Educational Background
    educationLevel: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'education_level',
      references: {
        model: 'education_levels',
        key: 'id'
      }
    },
    currentInstitution: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'current_institution'
    },
    gradeLevel: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'grade_level'
    },
    
    // Employment Status
    employmentStatus: {
      type: DataTypes.ENUM(
        'student',
        'employed',
        'unemployed',
        'self_employed',
        'other'
      ),
      allowNull: true,
      field: 'employment_status'
    },
    currentOccupation: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'current_occupation'
    },

    institutionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'institution_id',
      references: {
        model: 'institutions',
        key: 'id'
      }
    },
    
    // User Role & Status
    role: {
      type: DataTypes.ENUM('System Administrator', 'Test Administrator', 'Test Taker'),
      defaultValue: 'Test Taker',
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_email_verified'
    },
    createdByTestAdministrator: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'created_by_test_administrator'
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_verification_token'
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_expires'
    },
    
    // Preferences
    preferredLanguage: {
      type: DataTypes.ENUM('en', 'ss'),
      defaultValue: 'en',
      field: 'preferred_language'
    },
    
    // Accessibility
    requiresAccessibility: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'requires_accessibility'
    },
    accessibilityNeeds: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      field: 'accessibility_needs'
    },
    
    // Security
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_reset_token'
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires'
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'refresh_token'
    },
    refreshTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'refresh_token_expires'
    },
    
    // Extended user journey fields
    userType: {
      type: DataTypes.ENUM('High School Student', 'University Student', 'Professional', 'Test Administrator', 'System Administrator'),
      allowNull: true,
      field: 'user_type'
    },
    studentNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'student_number'
    },
    className: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'class_name'
    },
    studentCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'student_code'
    },
    degreeProgram: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'degree_program'
    },
    yearOfStudy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'year_of_study'
    },
    yearsExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'years_experience'
    },

    // Professional workplace fields
    workplaceInstitutionId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'workplace_institution_id'
    },
    workplaceName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'workplace_name'
    },

    // Test Administrator-specific fields
    testAdministratorCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'test_administrator_code'
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: true
    },

    // Password management
    mustChangePassword: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'must_change_password'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['username'], unique: true },
      { fields: ['email'], unique: true },
      { fields: ['national_id'], unique: true },
      { fields: ['student_number'], unique: true },
      { fields: ['student_code'], unique: true },
      { fields: ['institution_id'] },
      { fields: ['role'] },
      { fields: ['user_type'] },
      { fields: ['education_level'] },
      { fields: ['is_active'] },
      { fields: ['is_email_verified'] }
    ],
    
    hooks: {
      beforeCreate: async (user) => {
        // Hash password if present
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        
        // Parse national ID if present
        if (user.nationalId) {
          const parsedData = parseNationalId(user.nationalId);
          if (parsedData) {
            user.dateOfBirth = parsedData.dateOfBirth;
            user.gender = parsedData.gender;
          }
        }
      },
      beforeUpdate: async (user) => {
        // Hash password if changed
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
        
        // Parse national ID if changed
        if (user.changed('nationalId') && user.nationalId) {
          const parsedData = parseNationalId(user.nationalId);
          if (parsedData) {
            user.dateOfBirth = parsedData.dateOfBirth;
            user.gender = parsedData.gender;
          }
        }
      }
    }
  });
  
  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };
  
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    delete values.emailVerificationToken;
    delete values.refreshToken;
    delete values.refreshTokenExpires;
    return values;
  };
  
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };
  
  // Associations
  User.associate = (models) => {
    User.hasMany(models.Assessment, {
      foreignKey: 'userId',
      as: 'assessments'
    });
    
    User.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs'
    });

    User.belongsTo(models.EducationLevel, {
      foreignKey: 'educationLevel',
      targetKey: 'level',
      as: 'education'
    });

    User.belongsTo(models.Institution, {
      foreignKey: 'institutionId',
      as: 'institution'
    });

    User.hasOne(models.SchoolStudent, {
      foreignKey: 'userId',
      as: 'schoolStudent'
    });

    User.belongsToMany(models.Permission, {
      through: models.UserPermission,
      foreignKey: 'userId',
      otherKey: 'permissionId',
      as: 'permissions'
    });

    User.hasMany(models.UserQualification, {
      foreignKey: 'userId',
      as: 'qualifications'
    });
  };
  
  return User;
};

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // Authentication
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
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
      field: 'national_id'
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
      type: DataTypes.ENUM(
        'primary',
        'junior_secondary',
        'senior_secondary',
        'tvet',
        'diploma',
        'undergraduate',
        'postgraduate',
        'other'
      ),
      allowNull: true,
      field: 'education_level'
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
    
    // User Role & Status
    role: {
      type: DataTypes.ENUM('admin', 'counselor', 'user'),
      defaultValue: 'user',
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
    
    // Counselor-specific fields
    counselorCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      field: 'counselor_code'
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
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
    return values;
  };
  
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };
  
  // Associations
  User.associate = (models) => {
    User.hasMany(models.TestAttempt, {
      foreignKey: 'userId',
      as: 'testAttempts'
    });
    
    User.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs'
    });
  };
  
  return User;
};

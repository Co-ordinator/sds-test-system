const Joi = require('joi');

// Luhn algorithm implementation
const luhnCheck = (num) => {
  const arr = (num + '').split('').reverse().map(x => parseInt(x));
  const lastDigit = arr.shift();
  let sum = arr.reduce((acc, val, i) => {
    if (i % 2 === 0) val *= 2;
    if (val > 9) val -= 9;
    return acc + val;
  }, 0);
  sum += lastDigit;
  return sum % 10 === 0;
};

// Date validation for first 6 digits (YYMMDD)
const isValidDate = (yyMMdd) => {
  const yy = parseInt(yyMMdd.substring(0, 2));
  const mm = parseInt(yyMMdd.substring(2, 4)) - 1; // JS months are 0-indexed
  const dd = parseInt(yyMMdd.substring(4, 6));
  
  if (mm < 0 || mm > 11) return false;
  
  const date = new Date(2000 + yy, mm, dd);
  return date && 
    date.getFullYear() === 2000 + yy && 
    date.getMonth() === mm && 
    date.getDate() === dd;
};

// National ID validation (13 digits, valid date)
const validateNationalId = (value, helpers) => {
  if (!/^\d{13}$/.test(value)) {
    return helpers.error('string.pattern.base');
  }
  
  if (!isValidDate(value.substring(0, 6))) {
    return helpers.error('date.invalid');
  }
  
  // Luhn check removed for practical use - not all IDs use this algorithm
  
  return value;
};

// Password requirements: min 12 chars, at least 1 letter and 1 number.
// OWASP Authentication Cheat Sheet considers < 15 chars without MFA weak; we
// land at 12 as a pragmatic floor that still rules out the bulk of bot-tier
// password lists.
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{12,}$/;

const phonePattern = /^\+268\d{8}$/;

// Registration (v2.3.0): name + nationalId + email + password + consent.
// First name and surname are captured here (matches the national-ID record)
// so the onboarding wizard doesn't have to ask for them again.
const register = Joi.object({
  firstName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Given name is required',
    'any.required': 'Given name is required'
  }),
  lastName: Joi.string().trim().min(1).max(255).required().messages({
    'string.empty': 'Surname is required',
    'any.required': 'Surname is required'
  }),
  nationalId: Joi.string().custom(validateNationalId).required().messages({
    'any.required': 'National ID is required',
    'string.pattern.base': 'National ID must be exactly 13 digits',
    'date.invalid': 'National ID contains an invalid date',
    'luhn.invalid': 'National ID checksum is invalid'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 12 characters and contain both letters and numbers. Symbols are allowed.',
    'any.required': 'Password is required'
  }),
  consent: Joi.boolean().valid(true).required().messages({
    'boolean.base': 'You must accept the data processing terms',
    'any.only': 'You must accept the data processing terms to register',
    'any.required': 'You must accept the data processing terms to register'
  })
});

const login = Joi.object({
  identifier: Joi.string().optional(),
  email: Joi.string().optional(),
  username: Joi.string().optional(),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
}).or('identifier', 'email', 'username').messages({
  'object.missing': 'Please provide your email, username, or participant code'
});

const resetPassword = Joi.object({
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 12 characters and contain both letters and numbers. Symbols are allowed.',
    'any.required': 'New password is required'
  }),
  password: Joi.string().pattern(passwordPattern).optional(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

// Token in the body — preferred shape so the reset token isn't logged to NGINX
// access logs, browser history, or the Referer header.
const resetPasswordWithToken = Joi.object({
  token: Joi.string().min(20).required().messages({
    'any.required': 'Reset token is required'
  }),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 12 characters and contain both letters and numbers. Symbols are allowed.',
    'any.required': 'New password is required'
  }),
  password: Joi.string().pattern(passwordPattern).optional(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

const USER_TYPE_ENUM = [
  'High School Student',
  'University Student',
  'Professional',
  'Test Administrator',
  'System Administrator'
];

const updateProfile = Joi.object({
  firstName: Joi.string().max(255).allow('', null),
  lastName: Joi.string().max(255).allow('', null),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow('', null),
  // SECURITY: nationalId is the user's identity anchor and cannot be changed
  // via the self-service /me endpoint. Identity changes go through an
  // administrator-mediated, audited flow only.
  nationalId: Joi.forbidden().messages({
    'any.unknown': 'National ID cannot be changed here. Contact your administrator to request an identity change.'
  }),
  email: Joi.forbidden().messages({
    'any.unknown': 'Email cannot be changed here. Contact your administrator to request an identity change.'
  }),
  phoneNumber: Joi.string().pattern(/^\+268\d{8}$/).allow('', null),
  region: Joi.string().valid('hhohho', 'manzini', 'lubombo', 'shiselweni').allow('', null),
  district: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  educationLevel: Joi.string().uuid().allow('', null),
  currentInstitution: Joi.string().allow('', null),
  gradeLevel: Joi.string().allow('', null),
  employmentStatus: Joi.string().valid('student', 'employed', 'unemployed', 'self_employed', 'other').allow('', null),
  currentOccupation: Joi.string().allow('', null),
  currentOccupationId: Joi.string().uuid().allow('', null),
  preferredLanguage: Joi.string().valid('en', 'ss').allow('', null),
  requiresAccessibility: Joi.boolean().allow(null),
  accessibilityNeeds: Joi.object().pattern(/.*/, Joi.any()).allow(null),
  userType: Joi.string().valid(...USER_TYPE_ENUM).allow('', null),
  institutionId: Joi.string().uuid().allow('', null),
  workplaceInstitutionId: Joi.string().uuid().allow('', null),
  workplaceName: Joi.string().allow('', null),
  degreeProgram: Joi.string().allow('', null),
  yearOfStudy: Joi.number().integer().min(0).max(20).allow(null),
  yearsExperience: Joi.number().integer().min(0).max(80).allow(null),
  onboardingCompleted: Joi.forbidden()
}).min(1);

const forgotPasswordBody = Joi.object({
  identifier: Joi.string().optional(),
  email: Joi.string().email().optional()
}).or('identifier', 'email');

const resendVerification = Joi.object({
  email: Joi.string().email().required().messages({ 'any.required': 'Email is required' })
});

const verifyEmail = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Verification code must be exactly 6 digits',
    'string.pattern.base': 'Verification code must contain only digits',
    'any.required': 'Verification code is required'
  })
});

const resetPasswordWithOtp = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
    'string.length': 'Reset code must be exactly 6 digits',
    'string.pattern.base': 'Reset code must contain only digits',
    'any.required': 'Reset code is required'
  }),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'New password must be at least 12 characters and contain both letters and numbers. Symbols are allowed.',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'New password must be at least 12 characters and contain both letters and numbers. Symbols are allowed.',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

module.exports = {
  register,
  login,
  resetPassword,
  resetPasswordWithToken,
  updateProfile,
  forgotPasswordBody,
  resendVerification,
  verifyEmail,
  resetPasswordWithOtp,
  changePassword
};

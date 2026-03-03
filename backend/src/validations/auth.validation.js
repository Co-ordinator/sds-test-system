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

// National ID validation (13 digits, valid date, Luhn check)
const validateNationalId = (value, helpers) => {
  if (!/^\d{13}$/.test(value)) {
    return helpers.error('string.pattern.base');
  }
  
  if (!isValidDate(value.substring(0, 6))) {
    return helpers.error('date.invalid');
  }
  
  if (!luhnCheck(value)) {
    return helpers.error('luhn.invalid');
  }
  
  return value;
};

// Password requirements: min 8 chars, at least 1 letter and 1 number
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const register = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).optional(),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 8 characters and contain both letters and numbers',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().required().messages({
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().required().messages({
    'any.required': 'Last name is required'
  }),
  nationalId: Joi.string().custom(validateNationalId, 'National ID validation').required().messages({
    'string.pattern.base': 'Invalid National ID. Must be exactly 13 digits',
    'date.invalid': 'Invalid National ID. First 6 digits must represent a valid date (YYMMDD)',
    'luhn.invalid': 'Invalid National ID. Failed checksum verification',
    'any.required': 'National ID is required'
  }),
  role: Joi.string().valid('admin', 'counselor', 'user').required().messages({
    'any.only': 'Role must be one of admin, counselor, or user',
    'any.required': 'Role is required'
  }),
  region: Joi.string().valid('hhohho', 'manzini', 'lubombo', 'shiselweni').required().messages({
    'any.only': 'Region must be one of hhohho, manzini, lubombo, or shiselweni',
    'any.required': 'Region is required'
  }),
  dateOfBirth: Joi.date().iso().less('now').required().messages({
    'date.base': 'Date of birth must be a valid date',
    'date.format': 'Date of birth must be in YYYY-MM-DD format',
    'date.less': 'Date of birth must be in the past',
    'any.required': 'Date of birth is required'
  }),
  consent: Joi.boolean().valid(true).required().messages({
    'boolean.base': 'You must accept the data processing terms',
    'any.only': 'You must accept the data processing terms to register',
    'any.required': 'You must accept the data processing terms to register'
  }),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  phoneNumber: Joi.string().pattern(/^\+268\d{8}$/).optional().messages({
    'string.pattern.base': 'Phone number must be in Eswatini format (+268 followed by 8 digits)'
  })
}).or('email', 'username');

const login = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or Student ID is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const resetPassword = Joi.object({
  newPassword: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 8 characters and contain both letters and numbers',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'any.required': 'Please confirm your new password'
  })
});

const updateProfile = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+268\d{8}$/).allow('', null),
  region: Joi.string().valid('hhohho', 'manzini', 'lubombo', 'shiselweni').allow('', null),
  district: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  educationLevel: Joi.string().uuid().allow('', null),
  currentInstitution: Joi.string().allow('', null),
  gradeLevel: Joi.string().allow('', null),
  employmentStatus: Joi.string().valid('student', 'employed', 'unemployed', 'self_employed', 'other').allow('', null),
  currentOccupation: Joi.string().allow('', null),
  preferredLanguage: Joi.string().valid('en', 'ss').allow('', null),
  requiresAccessibility: Joi.boolean().allow(null),
  accessibilityNeeds: Joi.object().pattern(/.*/, Joi.any()).allow(null)
}).min(1);

const forgotPasswordBody = Joi.object({
  identifier: Joi.string().optional(),
  email: Joi.string().email().optional()
}).or('identifier', 'email');

const resendVerification = Joi.object({
  email: Joi.string().email().required().messages({ 'any.required': 'Email is required' })
});

module.exports = {
  register,
  login,
  resetPassword,
  updateProfile,
  forgotPasswordBody,
  resendVerification
};

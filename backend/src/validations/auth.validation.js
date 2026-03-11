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

const phonePattern = /^\+268\d{8}$/;

// Simple registration: email OR phone, password, consent. One identifier required.
const register = Joi.object({
  email: Joi.string().email().allow('', null).optional().messages({
    'string.email': 'Please provide a valid email address'
  }),
  phoneNumber: Joi.string().pattern(phonePattern).allow('', null).optional().messages({
    'string.pattern.base': 'Phone must be in Eswatini format (+268 followed by 8 digits)'
  }),
  password: Joi.string().pattern(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 8 characters and contain both letters and numbers',
    'any.required': 'Password is required'
  }),
  consent: Joi.boolean().valid(true).required().messages({
    'boolean.base': 'You must accept the data processing terms',
    'any.only': 'You must accept the data processing terms to register',
    'any.required': 'You must accept the data processing terms to register'
  })
}).or('email', 'phoneNumber').messages({
  'object.missing': 'Email or phone is required'
});

const login = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Email or Code is required'
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
  firstName: Joi.string().max(255).allow('', null),
  lastName: Joi.string().max(255).allow('', null),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').allow('', null),
  nationalId: Joi.string().pattern(/^\d{13}$/).allow('', null).messages({
    'string.pattern.base': 'National ID must be exactly 13 digits'
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

const Joi = require('joi');

// Eswatini national ID pattern (alphanumeric, 7-10 chars)
const nationalIdPattern = /^[A-Za-z0-9]{7,10}$/;

// Password requirements: min 8 chars, at least 1 letter and 1 number
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

const register = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
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
  nationalId: Joi.string().pattern(nationalIdPattern).required().messages({
    'string.pattern.base': 'National ID must be alphanumeric (7-10 characters)',
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
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional(),
  phoneNumber: Joi.string().pattern(/^\+268\d{8}$/).optional().messages({
    'string.pattern.base': 'Phone number must be in Eswatini format (+268 followed by 8 digits)'
  })
});

const login = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
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

module.exports = {
  register,
  login,
  resetPassword
};

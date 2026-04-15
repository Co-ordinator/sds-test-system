const { AuditLog } = require('../models');
const { ValidationError } = require('../utils/errors/appError');

const validate = (schema) => async (req, res, next) => {
  try {
    // Validate request body against schema
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      // Log validation error (AuditLog schema: actionType, description, details)
      await AuditLog.create({
        userId: null,
        actionType: 'SYSTEM',
        description: 'Validation failed',
        details: {
          path: req.baseUrl + req.path,
          requestMethod: req.method,
          errorMessage: error.message
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(() => {}); // avoid failing request if audit fails

      // Format error response
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return next(new ValidationError('Validation failed', errors));
    }

    // Replace body with validated values
    req.body = value;
    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;

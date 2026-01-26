const { AuditLog } = require('../models');

const validate = (schema) => async (req, res, next) => {
  try {
    // Validate request body against schema
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      // Log validation error
      await AuditLog.create({
        action: 'VALIDATION_ERROR',
        resourceType: req.baseUrl + req.path,
        requestMethod: req.method,
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Format error response
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    // Replace body with validated values
    req.body = value;
    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = validate;

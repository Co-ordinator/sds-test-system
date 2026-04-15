class AppError extends Error {
  constructor(message, {
    status = 500,
    code = 'INTERNAL_ERROR',
    details = undefined,
    expose = false
  } = {}) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = expose;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, { status: 400, code: 'VALIDATION_ERROR', details, expose: true });
    this.name = 'ValidationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, { status: 404, code, expose: true });
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT_ERROR') {
    super(message, { status: 409, code, expose: true });
    this.name = 'ConflictError';
  }
}

class AuthError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTH_ERROR', status = 401) {
    super(message, { status, code, expose: true });
    this.name = 'AuthError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN_ERROR') {
    super(message, { status: 403, code, expose: true });
    this.name = 'ForbiddenError';
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = 'BAD_REQUEST') {
    super(message, { status: 400, code, expose: true });
    this.name = 'BadRequestError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthError,
  ForbiddenError,
  BadRequestError
};

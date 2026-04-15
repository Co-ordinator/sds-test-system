jest.mock('../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const errorHandler = require('../src/middleware/errorHandling.middleware');
const { ValidationError, AppError } = require('../src/utils/errors/appError');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('error middleware', () => {
  it('returns standardized validation envelope', () => {
    const req = { requestId: 'req-1', method: 'POST', originalUrl: '/x' };
    const res = mockRes();
    const err = new ValidationError('Validation failed', [{ field: 'email', message: 'required' }]);
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'VALIDATION_ERROR',
      requestId: 'req-1',
      details: [{ field: 'email', message: 'required' }]
    }));
  });

  it('sanitizes unknown internal errors', () => {
    const req = { requestId: 'req-2', method: 'GET', originalUrl: '/y' };
    const res = mockRes();
    errorHandler(new Error('db exploded'), req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred.',
      requestId: 'req-2'
    }));
  });

  it('keeps exposed operational app errors', () => {
    const req = { requestId: 'req-3', method: 'GET', originalUrl: '/z' };
    const res = mockRes();
    const err = new AppError('Student not found', { status: 404, code: 'STUDENT_NOT_FOUND', expose: true });
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'STUDENT_NOT_FOUND',
      message: 'Student not found',
      requestId: 'req-3'
    }));
  });
});

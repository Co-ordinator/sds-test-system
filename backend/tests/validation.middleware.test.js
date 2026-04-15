jest.mock('../src/models', () => ({
  AuditLog: {
    create: jest.fn().mockResolvedValue({})
  }
}));

const Joi = require('joi');
const validate = require('../src/middleware/validatation.middleware');

const mockRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

describe('validation middleware', () => {
  it('passes valid payload to next', async () => {
    const schema = Joi.object({ email: Joi.string().email().required() });
    const req = { body: { email: 'a@b.com' }, baseUrl: '/api', path: '/x', method: 'POST', ip: '1.1.1.1', headers: {} };
    const next = jest.fn();
    await validate(schema)(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards standardized validation error', async () => {
    const schema = Joi.object({ email: Joi.string().email().required() });
    const req = { body: { email: 'invalid' }, baseUrl: '/api', path: '/x', method: 'POST', ip: '1.1.1.1', headers: {} };
    const next = jest.fn();
    await validate(schema)(req, mockRes(), next);
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(errorArg.details)).toBe(true);
  });
});

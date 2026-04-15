const crypto = require('crypto');

const requestIdMiddleware = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  const requestId = incoming && String(incoming).trim() ? String(incoming).trim() : crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

module.exports = requestIdMiddleware;

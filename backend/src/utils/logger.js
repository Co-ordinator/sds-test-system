const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { AuditLog } = require('../models');

// Custom transport for saving audit logs to database
class DatabaseTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.name = 'database';
    this.level = opts.level || 'info';
  }

  async log(info, callback) {
    try {
      // Only log if actionType is present and allowed by audit_logs enum (avoid crash on unknown types)
      const allowed = ['LOGIN', 'REGISTER', 'LOGOUT', 'TEST_START', 'TEST_COMPLETE', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'ACCESS_DENIED', 'SYSTEM'];
      if (info.actionType && allowed.includes(info.actionType)) {
        await AuditLog.create({
          userId: info.userId || null,
          actionType: info.actionType,
          description: info.message,
          details: info.details || {},
          ipAddress: info.ipAddress || null,
          userAgent: info.userAgent || null
        });
      }
      callback(null, true);
    } catch (error) {
      // Don't crash the app when DB audit insert fails (e.g. invalid enum)
      callback(null, true);
    }
  }
}

// Format to extract request metadata
const requestMetadata = winston.format((info) => {
  if (info.req) {
    info.userId = info.req.user?.id || null;
    info.ipAddress = info.req.ip || info.req.headers['x-forwarded-for'] || null;
    info.userAgent = info.req.headers['user-agent'] || null;
    info.requestId = info.req.requestId || null;
  }
  return info;
});

const SENSITIVE_KEYS = new Set([
  'password', 'newpassword', 'currentpassword', 'confirmpassword',
  'token', 'accesstoken', 'refreshtoken', 'passwordresettoken', 'emailverificationtoken',
  'authorization', 'apikey', 'secret', 'nationalid', 'national_id',
  'email', 'phonenumber', 'phone_number', 'address'
]);

const redactValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactValue);
  const output = {};
  for (const [key, nested] of Object.entries(value)) {
    const lowered = key.toLowerCase();
    output[key] = SENSITIVE_KEYS.has(lowered) ? '[REDACTED]' : redactValue(nested);
  }
  return output;
};

const redactPathTokens = (pathValue) => {
  if (typeof pathValue !== 'string') return pathValue;
  return pathValue
    .replace(/(\/verify-email\/)[^/?#]+/i, '$1[REDACTED]')
    .replace(/(\/reset-password\/)[^/?#]+/i, '$1[REDACTED]');
};

// Redact sensitive information
const redactSensitive = winston.format((info) => {
  if (info.req) {
    info.req.body = redactValue(info.req.body);
    info.req.params = redactValue(info.req.params);
    info.req.query = redactValue(info.req.query);
    info.req.url = redactPathTokens(info.req.url);
    info.req.path = redactPathTokens(info.req.path);
  }
  if (info.body) info.body = redactValue(info.body);
  if (info.details) info.details = redactValue(info.details);
  if (typeof info.message === 'string') info.message = redactPathTokens(info.message);
  return info;
});

const logger = winston.createLogger({
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    requestMetadata(),
    redactSensitive(),
    winston.format.json()
  ),
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Rotating file transport
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    // Database transport for audit logs
    new DatabaseTransport({
      level: 'info'
    })
  ],
  exitOnError: false
});

module.exports = logger;

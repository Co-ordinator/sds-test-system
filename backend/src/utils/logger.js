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
      // Only log if actionType is present (audit logs)
      if (info.actionType) {
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
      callback(error);
    }
  }
}

// Format to extract request metadata
const requestMetadata = winston.format((info) => {
  if (info.req) {
    info.userId = info.req.user?.id || null;
    info.ipAddress = info.req.ip || info.req.headers['x-forwarded-for'] || null;
    info.userAgent = info.req.headers['user-agent'] || null;
  }
  return info;
});

// Redact sensitive information
const redactSensitive = winston.format((info) => {
  if (info.body) {
    if (info.body.password) info.body.password = '[REDACTED]';
    if (info.body.token) info.body.token = '[REDACTED]';
    if (info.body.nationalId) info.body.nationalId = '[REDACTED]';
  }
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

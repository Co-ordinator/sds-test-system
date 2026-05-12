const nodemailer = require('nodemailer');
const path = require('path');
const logger = require('../utils/logger');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const smtpPort = Number.parseInt(process.env.SMTP_PORT, 10);
const maxConnections = parsePositiveInt(process.env.SMTP_MAX_CONNECTIONS, 1);
const maxMessages = parsePositiveInt(process.env.SMTP_MAX_MESSAGES, 100);
const retryAttempts = parsePositiveInt(process.env.SMTP_RETRY_ATTEMPTS, 3);
const retryBaseDelayMs = parsePositiveInt(process.env.SMTP_RETRY_BASE_DELAY_MS, 1500);
const retryMaxDelayMs = parsePositiveInt(process.env.SMTP_RETRY_MAX_DELAY_MS, 8000);
const queueIntervalMs = parsePositiveInt(process.env.SMTP_QUEUE_INTERVAL_MS, 250);

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.isFinite(smtpPort) ? smtpPort : undefined,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  pool: true,
  maxConnections,
  maxMessages,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

let hbsInitialized = false;
let hbsInitPromise = null;
let emailQueue = Promise.resolve();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const enqueueEmail = (task) => {
  const run = emailQueue.then(async () => {
    if (queueIntervalMs > 0) await wait(queueIntervalMs);
    return task();
  });
  emailQueue = run.catch(() => {});
  return run;
};

const ensureHandlebarsInitialized = async () => {
  if (hbsInitialized) return;
  if (!hbsInitPromise) {
    hbsInitPromise = (async () => {
      const hbs = (await import('nodemailer-express-handlebars')).default;
      const handlebarOptions = {
        viewEngine: {
          extName: '.hbs',
          partialsDir: path.resolve(__dirname, '../templates/emails'),
          defaultLayout: false
        },
        viewPath: path.resolve(__dirname, '../templates/emails'),
        extName: '.hbs'
      };
      transporter.use('compile', hbs(handlebarOptions));
      hbsInitialized = true;
    })();
  }
  await hbsInitPromise;
};

const isRetryableEmailError = (error) => {
  const responseCode = Number(error?.responseCode);
  if (responseCode >= 400 && responseCode < 500) return true;

  const errorCode = String(error?.code || '').toUpperCase();
  if (['ECONNECTION', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(errorCode)) {
    return true;
  }

  const message = `${error?.message || ''} ${error?.response || ''}`;
  return /421|too many concurrent|try again later|temporar|timeout|timed out|connection|socket|throttl|rate limit|invalid greeting/i.test(message);
};

const retryDelayForAttempt = (attempt) => {
  const delay = retryBaseDelayMs * (2 ** (attempt - 1));
  return Math.min(delay, retryMaxDelayMs);
};

const sendWithRetry = async (mailOptions) => {
  let lastError;

  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt >= retryAttempts || !isRetryableEmailError(error)) {
        throw error;
      }

      const delayMs = retryDelayForAttempt(attempt);
      logger.warn({
        actionType: 'EMAIL_RETRY',
        message: 'SMTP send failed; retrying',
        details: {
          recipient: mailOptions.to,
          subject: mailOptions.subject,
          attempt,
          nextAttempt: attempt + 1,
          delayMs,
          error: error.message
        }
      });
      await wait(delayMs);
    }
  }

  throw lastError;
};

// Email sending function
const sendEmail = async (options) => {
  // Lazy-load ESM handlebars plugin once (required for CommonJS).
  await ensureHandlebarsInitialized();

  const mailOptions = {
    from: `"SDS Test System" <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    template: options.template,
    context: options.context
  };

  try {
    return await enqueueEmail(() => sendWithRetry(mailOptions));
  } catch (error) {
    logger.error({
      actionType: 'EMAIL_FAILED',
      message: 'SMTP send failed',
      details: {
        recipient: options.email,
        subject: options.subject,
        error: error.message
      }
    });
    throw error;
  }
};

module.exports = {
  sendEmail
};

const nodemailer = require('nodemailer');
const path = require('path');
const dns = require('dns');
const logger = require('../utils/logger');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const smtpPort = Number.parseInt(process.env.SMTP_PORT, 10);
const smtpHost = process.env.SMTP_HOST;
const smtpFromEmail = process.env.SMTP_FROM_EMAIL;
const smtpFromName = process.env.SMTP_FROM_NAME || 'Self-Directed Search System';
const smtpReplyTo = process.env.SMTP_REPLY_TO || smtpFromEmail;
const maxConnections = parsePositiveInt(process.env.SMTP_MAX_CONNECTIONS, 1);
const maxMessages = parsePositiveInt(process.env.SMTP_MAX_MESSAGES, 100);
const retryAttempts = parsePositiveInt(process.env.SMTP_RETRY_ATTEMPTS, 2);
const retryBaseDelayMs = parsePositiveInt(process.env.SMTP_RETRY_BASE_DELAY_MS, 1000);
const retryMaxDelayMs = parsePositiveInt(process.env.SMTP_RETRY_MAX_DELAY_MS, 3000);
const queueIntervalMs = parsePositiveInt(process.env.SMTP_QUEUE_INTERVAL_MS, 250);
const dnsTimeoutMs = parsePositiveInt(process.env.SMTP_DNS_TIMEOUT_MS, 5000);
const connectionTimeoutMs = parsePositiveInt(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10000);
const greetingTimeoutMs = parsePositiveInt(process.env.SMTP_GREETING_TIMEOUT_MS, 10000);
const socketTimeoutMs = parsePositiveInt(process.env.SMTP_SOCKET_TIMEOUT_MS, 20000);

const resolveDkimConfig = () => {
  const domainName = String(process.env.DKIM_DOMAIN_NAME || '').trim();
  const keySelector = String(process.env.DKIM_KEY_SELECTOR || '').trim();
  const privateKey = String(process.env.DKIM_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();

  if (!domainName || !keySelector || !privateKey) return null;
  return { domainName, keySelector, privateKey };
};

const dkimConfig = resolveDkimConfig();

// Create transporter
const transporterOptions = {
  host: smtpHost,
  port: Number.isFinite(smtpPort) ? smtpPort : undefined,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  pool: true,
  maxConnections,
  maxMessages,
  connectionTimeout: connectionTimeoutMs,
  greetingTimeout: greetingTimeoutMs,
  socketTimeout: socketTimeoutMs,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};

if (dkimConfig) {
  transporterOptions.dkim = dkimConfig;
}

const transporter = nodemailer.createTransport(transporterOptions);

let hbsInitialized = false;
let hbsInitPromise = null;
let emailQueue = Promise.resolve();

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const resolveSmtpHost = async () => {
  if (!smtpHost) {
    const error = new Error('SMTP_HOST is not configured');
    error.code = 'SMTP_HOST_MISSING';
    throw error;
  }

  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(`SMTP host lookup timed out after ${dnsTimeoutMs}ms: ${smtpHost}`);
      error.code = 'EDNSTIMEOUT';
      reject(error);
    }, dnsTimeoutMs);
  });

  try {
    await Promise.race([dns.promises.lookup(smtpHost), timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

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
  if (['ECONNECTION', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'ETIMEDOUT', 'EAI_AGAIN', 'EDNSTIMEOUT'].includes(errorCode)) {
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
      await resolveSmtpHost();
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

const buildPlainText = ({ subject, template, context = {} }) => {
  const name = context.firstName || 'there';
  const code = context.verificationCode || context.verificationOtp || '';
  const minutes = context.otpExpiresMinutes || 'a few';
  const loginUrl = context.loginUrl || process.env.FRONTEND_URL || '';

  if (template === 'verify-email') {
    return [
      `Hello ${name},`,
      '',
      'Use this one-time verification code to complete your Self-Directed Search System registration:',
      code,
      '',
      `This code expires in ${minutes} minutes.`,
      'Return to the registration page and enter this code to continue.',
      '',
      'If you did not request this code, you can ignore this email.',
      '',
      'Self-Directed Search System',
      'Ministry of Labour and Social Security - Kingdom of Eswatini'
    ].join('\n');
  }

  if (template === 'reset-password-otp') {
    return [
      `Hello ${name},`,
      '',
      'Use this one-time code to reset your Self-Directed Search System account password:',
      code,
      '',
      `This code expires in ${minutes} minutes.`,
      '',
      'If you did not request a password reset, you can ignore this email.',
      '',
      'Self-Directed Search System',
      'Ministry of Labour and Social Security - Kingdom of Eswatini'
    ].join('\n');
  }

  if (template === 'user-welcome') {
    return [
      `Hello ${name},`,
      '',
      `Your ${context.role || 'Self-Directed Search System'} account has been created for the Self-Directed Search System.`,
      context.email ? `Username/email: ${context.email}` : '',
      (context.tempPassword || context.password) ? `Temporary password: ${context.tempPassword || context.password}` : '',
      loginUrl ? `Login: ${loginUrl}` : '',
      '',
      'You may be asked to change your password after signing in.',
      '',
      'Self-Directed Search System',
      'Ministry of Labour and Social Security - Kingdom of Eswatini'
    ].filter(Boolean).join('\n');
  }

  if (template === 'student-credentials') {
    return [
      `Hello ${name},`,
      '',
      'Your school has created Self-Directed Search System access credentials for you.',
      context.studentCode ? `Login number: ${context.studentCode}` : '',
      context.tempPassword ? `Temporary password: ${context.tempPassword}` : '',
      loginUrl ? `Login: ${loginUrl}` : '',
      '',
      'Keep these details safe and change your password after signing in.',
      '',
      'Self-Directed Search System',
      'Ministry of Labour and Social Security - Kingdom of Eswatini'
    ].filter(Boolean).join('\n');
  }

  if (template === 'test-results') {
    const recommendations = (context.recommendations || [])
      .map((item) => `- ${item.title}: ${item.matchPercentage}% match (${item.field})`);
    return [
      `Hello ${name},`,
      '',
      'Your Self-Directed Search career assessment results are ready.',
      context.hollandCode ? `Holland Code: ${context.hollandCode}` : '',
      context.hollandLabel ? `Profile: ${context.hollandLabel}` : '',
      '',
      ...(recommendations.length > 0 ? ['Top career recommendations:', ...recommendations, ''] : []),
      'Sign in to the SDS Career Assessment System to explore your full results.',
      '',
      'Self-Directed Search System',
      'Ministry of Labour and Social Security - Kingdom of Eswatini'
    ].filter((line) => line !== '').join('\n');
  }

  return [
    subject || 'SDS Test System',
    '',
    'This is an automated message from the Self-Directed Search System, Ministry of Labour and Social Security.'
  ].join('\n');
};

// Email sending function
const sendEmail = async (options) => {
  // Lazy-load ESM handlebars plugin once (required for CommonJS).
  await ensureHandlebarsInitialized();

  const mailOptions = {
    from: { name: smtpFromName, address: smtpFromEmail },
    envelope: {
      from: smtpFromEmail,
      to: options.email
    },
    to: options.email,
    replyTo: smtpReplyTo,
    subject: options.subject,
    template: options.template,
    context: options.context,
    text: options.text || buildPlainText(options),
    priority: 'normal',
    headers: {
      'Auto-Submitted': 'auto-generated'
    }
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

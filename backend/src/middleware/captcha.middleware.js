'use strict';

const logger = require('../utils/logger');
const { AppError } = require('../utils/errors/appError');

/**
 * Optional CAPTCHA verification middleware.
 *
 * Activates only when `CAPTCHA_PROVIDER` is set to `turnstile` (Cloudflare
 * Turnstile) or `hcaptcha`, AND `CAPTCHA_SECRET_KEY` is supplied. When
 * inactive (the default in development) this middleware is a no-op so
 * existing flows work without configuration.
 *
 * Expected payload from the client (any one of):
 *   - `req.headers['cf-turnstile-response']`   (Cloudflare widget header)
 *   - `req.headers['h-captcha-response']`      (hCaptcha widget header)
 *   - `req.body.captchaToken`                  (generic field)
 *
 * If the token is missing or fails verification, the middleware rejects with
 * 403 / `CAPTCHA_REQUIRED`.
 */

const PROVIDERS = {
  turnstile: {
    endpoint: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    headerKey: 'cf-turnstile-response'
  },
  hcaptcha: {
    endpoint: 'https://hcaptcha.com/siteverify',
    headerKey: 'h-captcha-response'
  }
};

const isEnabled = () => {
  const provider = String(process.env.CAPTCHA_PROVIDER || '').toLowerCase().trim();
  const secret = String(process.env.CAPTCHA_SECRET_KEY || '').trim();
  return Boolean(provider && secret && PROVIDERS[provider]);
};

const verifyToken = async (provider, secret, token, remoteIp) => {
  const cfg = PROVIDERS[provider];
  if (!cfg) return { success: false, error: 'unsupported-provider' };

  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (remoteIp) params.append('remoteip', remoteIp);

  try {
    const response = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data = await response.json().catch(() => ({}));
    return { success: Boolean(data && data.success), raw: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const captchaRequired = (req, res, next) => {
  if (!isEnabled()) return next();

  const provider = String(process.env.CAPTCHA_PROVIDER || '').toLowerCase().trim();
  const secret = String(process.env.CAPTCHA_SECRET_KEY || '').trim();
  const cfg = PROVIDERS[provider];

  const token = (req.headers[cfg.headerKey]
    || req.body?.captchaToken
    || '').toString().trim();

  if (!token) {
    return next(new AppError('CAPTCHA verification is required.', {
      status: 403, code: 'CAPTCHA_REQUIRED', expose: true
    }));
  }

  verifyToken(provider, secret, token, req.ip)
    .then((result) => {
      if (!result.success) {
        logger.warn({
          actionType: 'SYSTEM',
          message: 'CAPTCHA verification failed',
          req,
          details: { provider, error: result.error || result.raw?.['error-codes'] }
        });
        return next(new AppError('CAPTCHA verification failed.', {
          status: 403, code: 'CAPTCHA_FAILED', expose: true
        }));
      }
      return next();
    })
    .catch((err) => {
      logger.error({
        actionType: 'SYSTEM',
        message: 'CAPTCHA verification errored',
        req,
        details: { provider, error: err.message }
      });
      return next(new AppError('CAPTCHA verification could not be completed. Please try again.', {
        status: 503, code: 'CAPTCHA_UNAVAILABLE', expose: true
      }));
    });
};

module.exports = {
  captchaRequired,
  isEnabled
};

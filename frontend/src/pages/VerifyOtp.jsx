import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, TYPO } from '../theme/government';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

const maskEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}@${domain}`;
};

/**
 * Post-registration email verification.
 *
 * Industry-standard pattern (Auth0 EmailOtpChallenge, Stripe/Clerk, etc.):
 * the destination email is set by the registration step and is NOT editable
 * on the verification screen — we only display it (masked) and offer a
 * resend control. If we somehow land here without an email in state, we
 * send the user back to /register rather than asking them to retype it.
 */
export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();

  const email = useMemo(() => {
    const fromState = location.state?.email;
    if (fromState) return String(fromState).trim().toLowerCase();
    try {
      const stored = sessionStorage.getItem('pendingVerificationEmail');
      return stored ? String(stored).trim().toLowerCase() : '';
    } catch (_) {
      return '';
    }
  }, [location.state]);
  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [info, setInfo] = useState(() => {
    // When the user lands here from /login because their account is
    // unverified, the previous OTP is almost certainly expired (15-min TTL).
    // Surface the hint so they know to use the resend control rather than
    // hunting through inbox for an old code.
    const stateMessage = location.state?.message;
    if (typeof stateMessage === 'string' && stateMessage.trim()) return stateMessage.trim();
    if (location.state?.fromLogin) {
      return 'Your account is not verified yet. If your previous code expired, request a new one below.';
    }
    return '';
  });
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputsRef = useRef([]);

  useEffect(() => {
    if (email) {
      try { sessionStorage.setItem('pendingVerificationEmail', email); } catch (_) {}
    }
  }, [email]);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    const t = inputsRef.current[0];
    if (t) t.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const id = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const otpValue = digits.join('');
  const otpComplete = otpValue.length === OTP_LENGTH && /^\d{6}$/.test(otpValue);

  const submitOtp = useCallback(async (codeOverride) => {
    const code = (codeOverride ?? otpValue).trim();
    if (!email) return;
    if (!/^\d{6}$/.test(code)) {
      setServerError('Please enter the 6-digit verification code.');
      return;
    }

    setSubmitting(true);
    setServerError('');
    setInfo('');

    try {
      const res = await api.post('/api/v1/auth/verify-email', { email, otp: code });
      const userData = res.data?.data?.user;

      try { sessionStorage.removeItem('pendingVerificationEmail'); } catch (_) {}

      let authenticatedUser = userData || null;
      try {
        const meRes = await api.get('/api/v1/auth/me', { skipAuthRetry: true });
        authenticatedUser = meRes.data?.data?.user ?? meRes.data?.user ?? authenticatedUser;
      } catch (_) {}

      if (authenticatedUser) {
        setSession(null, authenticatedUser);
      }

      setSuccess(true);
      setTimeout(() => {
        if (authenticatedUser) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      }, 900);
    } catch (err) {
      const message = err?.uiMessage || err?.response?.data?.message || 'Verification code is invalid or has expired.';
      setServerError(message);
      setDigits(Array(OTP_LENGTH).fill(''));
      const first = inputsRef.current[0];
      if (first) first.focus();
    } finally {
      setSubmitting(false);
    }
  }, [otpValue, email, setSession, navigate]);

  const handleDigitChange = (index, raw) => {
    const cleaned = String(raw || '').replace(/\D/g, '');
    if (!cleaned) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, OTP_LENGTH - index).split('');
      setDigits((prev) => {
        const next = [...prev];
        for (let i = 0; i < chars.length && index + i < OTP_LENGTH; i += 1) {
          next[index + i] = chars[i];
        }
        return next;
      });
      const nextFocus = Math.min(index + chars.length, OTP_LENGTH - 1);
      const target = inputsRef.current[nextFocus];
      if (target) target.focus();
      const fullCode = (() => {
        const arr = [...digits];
        for (let i = 0; i < chars.length && index + i < OTP_LENGTH; i += 1) {
          arr[index + i] = chars[i];
        }
        return arr.join('');
      })();
      if (fullCode.length === OTP_LENGTH && /^\d{6}$/.test(fullCode)) {
        submitOtp(fullCode);
      }
      return;
    }

    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (index < OTP_LENGTH - 1) {
      const target = inputsRef.current[index + 1];
      if (target) target.focus();
    } else {
      const arr = [...digits];
      arr[index] = cleaned;
      const full = arr.join('');
      if (full.length === OTP_LENGTH && /^\d{6}$/.test(full)) {
        submitOtp(full);
      }
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        return;
      }
      if (index > 0) {
        const target = inputsRef.current[index - 1];
        if (target) target.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      const target = inputsRef.current[index - 1];
      if (target) target.focus();
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      const target = inputsRef.current[index + 1];
      if (target) target.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (otpComplete && !submitting) submitOtp();
    }
  };

  const handlePaste = (event) => {
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    const arr = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) arr[i] = pasted[i];
    setDigits(arr);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    const target = inputsRef.current[focusIndex];
    if (target) target.focus();
    if (pasted.length === OTP_LENGTH) submitOtp(pasted);
  };

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setServerError('');
    setInfo('');
    if (!email) return;
    setResending(true);
    try {
      await api.post('/api/v1/auth/resend-verification', { email });
      setInfo('A new 6-digit code has been sent to your email.');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setServerError(err?.uiMessage || err?.response?.data?.message || 'We could not send a new code right now. Please try again shortly.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!submitting) submitOtp();
  };

  const resendLabel = resending
    ? 'Sending…'
    : resendCooldown > 0
      ? `Resend available in ${resendCooldown}s`
      : 'Resend verification code';

  return (
    <OnboardingLayout>
      <div className="w-full max-w-[440px] mx-auto">
        <div
          className="w-full bg-white rounded-md border py-7 px-6 sm:px-8"
          style={{ borderColor: GOV.border }}
        >
          {success ? (
            <div className="text-center space-y-4">
              <div
                className="mx-auto flex items-center justify-center h-12 w-12 rounded-full"
                style={{ backgroundColor: GOV.blueLight }}
              >
                <svg className="h-6 w-6" style={{ color: GOV.blue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                Email verified
              </h2>
              <p className={TYPO.bodySmall} style={{ color: GOV.textMuted }}>
                Taking you to your onboarding…
              </p>
              <div className="flex justify-center">
                <div
                  className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent"
                  style={{ borderColor: GOV.blue }}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="text-center mb-5">
                <div
                  className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-3"
                  style={{ backgroundColor: GOV.blueLight }}
                >
                  <svg className="h-6 w-6" style={{ color: GOV.blue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className={TYPO.pageTitle} style={{ color: GOV.text }}>
                  Enter verification code
                </h2>
                <p className={`${TYPO.bodySmall} mt-1`} style={{ color: GOV.textMuted }}>
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold" style={{ color: GOV.text }}>
                    {maskEmail(email) || 'your email'}
                  </span>
                  . Enter it below to verify your account.
                </p>
              </div>

              <div
                className="flex justify-between gap-2 mb-1"
                onPaste={handlePaste}
                role="group"
                aria-label="One-time verification code"
              >
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_LENGTH}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1}`}
                    disabled={submitting}
                    className="w-full h-12 text-center rounded-md border text-lg font-semibold outline-none focus:ring-2 transition"
                    style={{
                      borderColor: serverError ? GOV.error : GOV.border,
                      color: GOV.text,
                      backgroundColor: GOV.borderLight,
                      letterSpacing: '0.05em',
                    }}
                  />
                ))}
              </div>

              <p className={`${TYPO.hint} text-center`} style={{ color: GOV.textHint }}>
                Code expires in 5 minutes.
              </p>

              <p className={`${TYPO.bodySmall} text-center mt-2`} style={{ color: GOV.textMuted }}>
                Didn&apos;t receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="font-semibold underline decoration-2 underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50 bg-transparent border-0 p-0 cursor-pointer"
                  style={{ color: GOV.blue }}
                >
                  {resendLabel}
                </button>
              </p>

              {serverError && (
                <div
                  className={`mt-4 rounded-md px-3 py-2 ${TYPO.hint}`}
                  style={{ backgroundColor: GOV.errorBg, color: GOV.error, border: `1px solid ${GOV.errorBorder}` }}
                  role="alert"
                >
                  <div>{serverError}</div>
                  <div className="mt-1" style={{ color: GOV.textMuted }}>
                    Already verified?{' '}
                    <Link to="/login" className="font-semibold underline" style={{ color: GOV.blue }}>
                      Sign in
                    </Link>
                  </div>
                </div>
              )}

              {info && !serverError && (
                <div
                  className={`mt-4 rounded-md px-3 py-2 ${TYPO.hint}`}
                  style={{ backgroundColor: GOV.blueLightAlt, color: GOV.blue, border: `1px solid ${GOV.blueLight}` }}
                  role="status"
                >
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={!otpComplete || submitting}
                className="w-full mt-5 py-2.5 rounded-md font-semibold text-white text-sm transition-opacity disabled:opacity-60"
                style={{ backgroundColor: GOV.blue }}
              >
                {submitting ? 'Verifying…' : 'Verify & continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </OnboardingLayout>
  );
}

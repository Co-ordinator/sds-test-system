import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Mail, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import api from '../services/api';
import AuthShell from '../components/auth/AuthShell';

const DEFAULT_RESEND_SECONDS = 120;

const inputClass = (hasError) =>
  `h-11 w-full rounded-md border bg-white px-3 text-sm font-medium text-[#111827] shadow-sm outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#2d8bc4] focus:ring-2 focus:ring-[#2d8bc4]/15 ${
    hasError ? 'border-[#fecaca] bg-[#fffafa]' : 'border-[#d8e1ea]'
  }`;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const formatTimer = (secondsRemaining) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formError, setFormError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const timerText = useMemo(() => formatTimer(Math.max(resendSeconds, 0)), [resendSeconds]);
  const canResend = resendSeconds <= 0 && !isResending;

  const requestCode = async () => {
    setFormError('');
    setInfoMessage('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setFormError('Enter your email address or SDS code.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { identifier: cleanIdentifier });
      const resolvedEmail = String(response?.data?.data?.email || '').trim().toLowerCase();
      const fallbackEmail = cleanIdentifier.includes('@') ? cleanIdentifier.toLowerCase() : '';
      const usableEmail = resolvedEmail || fallbackEmail;

      if (!usableEmail) {
        setFormError('Could not resolve your email for OTP verification. Please use your email address.');
        setIsSubmittingRequest(false);
        return;
      }

      const cooldown = toPositiveInt(response?.data?.resendAvailableInSeconds, DEFAULT_RESEND_SECONDS);
      setEmail(usableEmail);
      setIdentifier(cleanIdentifier);
      setResendSeconds(cooldown);
      setStep('verify');
      setInfoMessage('A reset code was sent to your email. Enter it below with your new password.');
    } catch (error) {
      const retrySeconds = toPositiveInt(
        error?.raw?.response?.data?.resendAvailableInSeconds ?? error?.response?.data?.resendAvailableInSeconds,
        -1
      );
      if (retrySeconds >= 0) {
        setResendSeconds(retrySeconds);
      }
      setFormError(error?.uiMessage || error?.raw?.response?.data?.message || 'Request failed.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const resendCode = async () => {
    setFormError('');
    setInfoMessage('');

    const resendIdentifier = email || identifier;
    if (!resendIdentifier) {
      setFormError('Start by requesting a reset code first.');
      return;
    }

    setIsResending(true);
    try {
      const response = await api.post('/api/v1/auth/forgot-password', { identifier: resendIdentifier });
      const cooldown = toPositiveInt(response?.data?.resendAvailableInSeconds, DEFAULT_RESEND_SECONDS);
      const resolvedEmail = String(response?.data?.data?.email || email || '').trim().toLowerCase();
      if (resolvedEmail) setEmail(resolvedEmail);
      setResendSeconds(cooldown);
      setCode('');
      setInfoMessage('A new reset code was sent to your email.');
    } catch (error) {
      const retrySeconds = toPositiveInt(
        error?.raw?.response?.data?.resendAvailableInSeconds ?? error?.response?.data?.resendAvailableInSeconds,
        -1
      );
      if (retrySeconds >= 0) {
        setResendSeconds(retrySeconds);
      }
      setFormError(error?.uiMessage || error?.raw?.response?.data?.message || 'Could not resend code.');
    } finally {
      setIsResending(false);
    }
  };

  const submitReset = async () => {
    setFormError('');
    setInfoMessage('');

    if (!email.trim()) {
      setFormError('Email is required.');
      return;
    }
    if (!/^\d{6}$/.test(code.trim())) {
      setFormError('Enter the 6-digit reset code sent to your email.');
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
      setFormError('Use at least 8 characters with letters and numbers. Symbols are allowed.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmittingReset(true);
    try {
      await api.post('/api/v1/auth/reset-password-otp', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
        confirmPassword
      });
      setSuccessMessage('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (error) {
      setFormError(error?.uiMessage || error?.raw?.response?.data?.message || 'Password reset failed.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={step === 'request' ? 'Reset password' : 'Enter reset code'}
      subtitle={step === 'request'
        ? 'Request a one-time code to reset your password.'
        : 'Enter the code from your email and choose a new password.'}
      panelTitle="Recover account access"
      panelText="Use a secure one-time code from your inbox to reset your SDS account password."
    >
      <div className="space-y-4">
        {step === 'request' && (
          <div>
            <label htmlFor="forgot-identifier" className="mb-1.5 block text-xs font-bold text-[#374151]">
              Email or SDS code
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
              <input
                id="forgot-identifier"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com or SDS123456"
                className={`${inputClass(!!formError)} pl-9`}
              />
            </div>
          </div>
        )}

        {step === 'verify' && (
          <>
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-bold text-[#374151]">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass(!!formError)} pl-9`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="forgot-code" className="mb-1.5 block text-xs font-bold text-[#374151]">
                Reset code
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
                <input
                  id="forgot-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className={`${inputClass(!!formError)} pl-9 tracking-[0.25em]`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="forgot-new-password" className="mb-1.5 block text-xs font-bold text-[#374151]">
                New password
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
                <input
                  id="forgot-identifier"
                  {...register('identifier', { required: 'Required' })}
                  placeholder="your@email.com or SDS123456"
                  className={`form-control ${TYPO.body}`}
                  style={{ color: GOV.text }}
                  aria-invalid={errors.identifier ? 'true' : 'false'}
                />
                {errors.identifier && (
                  <p className={`mt-1 ${TYPO.hint}`} style={{ color: GOV.error }}>{errors.identifier.message}</p>
                )}
              </div>

            <div>
              <label htmlFor="forgot-confirm-password" className="mb-1.5 block text-xs font-bold text-[#374151]">
                Confirm new password
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
                <input
                  id="forgot-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  className={`${inputClass(!!formError)} pl-9 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {infoMessage && (
          <div
            className="flex gap-2 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-medium text-[#1d4ed8]"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{infoMessage}</span>
          </div>
        )}

        {formError && (
          <div
            className="flex gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div
            className="flex gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-medium text-[#166534]"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        {step === 'request' ? (
          <button
            type="button"
            disabled={isSubmittingRequest}
            onClick={requestCode}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {isSubmittingRequest ? 'Sending code...' : 'Send reset code'}
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={isSubmittingReset}
              onClick={submitReset}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {isSubmittingReset ? 'Updating password...' : 'Reset password'}
            </button>

            <button
              type="button"
              onClick={resendCode}
              disabled={!canResend}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#2d8bc4] bg-[#f7fbff] px-4 text-sm font-bold text-[#2d8bc4] transition-colors disabled:cursor-not-allowed disabled:border-[#d8e1ea] disabled:text-[#9ca3af]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {isResending ? 'Sending code...' : canResend ? 'Resend code' : `Resend available in ${timerText}`}
            </button>
          </>
        )}

        <div className="rounded-md bg-[#f7fbff] px-3 py-3 text-center text-xs font-medium text-[#4b5563]">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-[#2d8bc4] hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

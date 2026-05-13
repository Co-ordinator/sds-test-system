import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, KeyRound, Mail, RotateCcw, ShieldCheck } from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState(location.state?.message || '');
  const [resendError, setResendError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(() => {
    if (!location.state) return 0;
    if (location.state?.verificationEmailSent === false) return 0;
    return toPositiveInt(location.state?.resendAvailableInSeconds, DEFAULT_RESEND_SECONDS);
  });

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((previous) => (previous <= 1 ? 0 : previous - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const canResend = resendSeconds <= 0 && !isResending;
  const timerText = useMemo(() => formatTimer(Math.max(resendSeconds, 0)), [resendSeconds]);

  const verifyCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.trim();

    setVerificationError('');
    setVerificationMessage('');
    setResendError('');

    if (!normalizedEmail) {
      setVerificationError('Enter your email address.');
      return;
    }
    if (!/^\d{6}$/.test(normalizedCode)) {
      setVerificationError('Enter the 6-digit verification code sent to your email.');
      return;
    }

    setIsVerifying(true);
    try {
      const response = await api.post('/api/v1/auth/verify-email-otp', {
        email: normalizedEmail,
        code: normalizedCode
      });
      const user = response?.data?.data?.user;
      if (user) {
        setSession(null, user);
      }
      navigate('/onboarding', { replace: true });
    } catch (error) {
      setVerificationError(error?.uiMessage || error?.raw?.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setResendError('');
    setVerificationMessage('');
    setVerificationError('');

    if (!normalizedEmail) {
      setResendError('Enter your email address first.');
      return;
    }

    setIsResending(true);
    try {
      const response = await api.post('/api/v1/auth/resend-verification', { email: normalizedEmail });
      const nextWindow = toPositiveInt(response?.data?.resendAvailableInSeconds, DEFAULT_RESEND_SECONDS);
      setResendSeconds(nextWindow);
      setCode('');
      setVerificationMessage('A new verification code has been sent. Check your inbox and enter it below.');
    } catch (error) {
      const retrySeconds = toPositiveInt(
        error?.raw?.response?.data?.resendAvailableInSeconds ?? error?.response?.data?.resendAvailableInSeconds,
        -1
      );
      if (retrySeconds >= 0) {
        setResendSeconds(retrySeconds);
      }
      setResendError(error?.uiMessage || error?.raw?.response?.data?.message || 'Could not resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Verify account"
      title="Enter verification code"
      subtitle="We sent a 6-digit code to your email. Paste it here to continue to onboarding."
      panelTitle="Secure email verification"
      panelText="Your SDS profile is created. Verify your email with the code from your inbox before you proceed."
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="verify-email" className="mb-1.5 block text-xs font-bold text-[#374151]">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="verify-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={`${inputClass(false)} pl-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="verify-code" className="mb-1.5 block text-xs font-bold text-[#374151]">
            Verification code
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className={`${inputClass(!!verificationError)} pl-9 tracking-[0.25em]`}
            />
          </div>
          <p className="mt-1.5 text-xs font-medium text-[#6b7280]">
            Didn&apos;t receive it? You can request another code after the timer ends.
          </p>
        </div>

        {verificationMessage && (
          <div className="flex gap-2 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-medium text-[#1d4ed8]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{verificationMessage}</span>
          </div>
        )}

        {verificationError && (
          <div className="flex gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{verificationError}</span>
          </div>
        )}

        {resendError && (
          <div className="flex gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{resendError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={verifyCode}
          disabled={isVerifying}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {isVerifying ? 'Verifying...' : 'Verify code'}
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

        <div className="rounded-md bg-[#f7fbff] px-3 py-3 text-center text-xs font-medium text-[#4b5563]">
          Already verified?{' '}
          <Link to="/login" className="font-bold text-[#2d8bc4] hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Fingerprint, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import api from '../services/api';
import AuthShell from '../components/auth/AuthShell';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const inputClass = (hasError) =>
  `h-11 w-full rounded-md border bg-white px-3 text-sm font-medium text-[#111827] shadow-sm outline-none transition-colors placeholder:text-[#9ca3af] focus:border-[#2d8bc4] focus:ring-2 focus:ring-[#2d8bc4]/15 ${
    hasError ? 'border-[#fecaca] bg-[#fffafa]' : 'border-[#d8e1ea]'
  }`;

export default function Register() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerError('');
    const payload = {
      nationalId: data.nationalId.trim(),
      email: data.email.trim(),
      password: data.password,
      consent: true
    };
    try {
      const response = await api.post('/api/v1/auth/register', payload);
      const verificationEmailSent = response?.data?.verificationEmailSent !== false;
      const resendAvailableInSeconds = response?.data?.resendAvailableInSeconds;
      navigate('/registration-success', {
        state: {
          email: payload.email,
          verificationEmailSent,
          resendAvailableInSeconds,
          message: response?.data?.message || ''
        }
      });
    } catch (err) {
      const uiMessage = err?.uiMessage || err?.response?.data?.message || 'Registration failed. Please try again.';
      const details = Array.isArray(err?.details) ? err.details : [];

      let hasFieldError = false;
      for (const detail of details) {
        const field = detail?.field;
        const message = detail?.message;
        if (!field || !message) continue;
        if (!['nationalId', 'email', 'password', 'consent'].includes(field)) continue;
        setError(field, { type: 'server', message });
        hasFieldError = true;
      }

      if (err?.code === 'NATIONAL_ID_EXISTS') {
        setError('nationalId', { type: 'server', message: uiMessage });
        hasFieldError = true;
      }

      if (err?.code === 'EMAIL_EXISTS') {
        setError('email', { type: 'server', message: uiMessage });
        hasFieldError = true;
      }

      if (!hasFieldError) setServerError(uiMessage);
    }
  };

  return (
    <AuthShell
      eyebrow="Create profile"
      title="Register for SDS"
      subtitle="Create a secure profile first. You will verify your email before starting the assessment."
      panelTitle="Start with a secure SDS profile"
      panelText="Register once, verify your email, then complete the Self-Directed Search assessment when you are ready."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="reg-national-id" className="mb-1.5 block text-xs font-bold text-[#374151]">
            National ID
          </label>
          <div className="relative">
            <Fingerprint className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="reg-national-id"
              {...register('nationalId', {
                required: 'National ID is required',
                pattern: {
                  value: /^\d{13}$/,
                  message: 'National ID must be exactly 13 digits'
                }
              })}
              type="text"
              inputMode="numeric"
              maxLength={13}
              placeholder="13-digit ID number"
              className={`${inputClass(!!errors.nationalId)} pl-9`}
            />
          </div>
          {errors.nationalId ? (
            <p className="mt-1.5 text-xs font-medium text-[#b91c1c]">{errors.nationalId.message}</p>
          ) : (
            <p className="mt-1.5 text-xs font-medium text-[#6b7280]">
              Used to prevent duplicate accounts and link your SDS profile.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="mb-1.5 block text-xs font-bold text-[#374151]">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="reg-email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: EMAIL_REGEX,
                  message: 'Enter a valid email address'
                }
              })}
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              className={`${inputClass(!!errors.email)} pl-9`}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium text-[#b91c1c]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="mb-1.5 block text-xs font-bold text-[#374151]">
            Password
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" aria-hidden="true" />
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
                pattern: {
                  value: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
                  message: 'Use at least 8 characters with letters and numbers. Symbols are allowed.'
                }
              })}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={`${inputClass(!!errors.password)} pl-9 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-xs font-medium text-[#b91c1c]">{errors.password.message}</p>
          ) : (
            <p className="mt-1.5 text-xs font-medium text-[#6b7280]">
              Use at least 8 characters with letters and numbers. Symbols are allowed.
            </p>
          )}
        </div>

        <div className="rounded-md border border-[#d8e1ea] bg-[#f8fbfd] p-3">
          <label htmlFor="reg-consent" className="flex items-start gap-3">
            <input
              id="reg-consent"
              type="checkbox"
              {...register('consent', { required: 'You must accept the terms' })}
              className="mt-0.5 h-4 w-4 shrink-0 rounded"
              style={{ accentColor: '#2d8bc4' }}
            />
            <span className="text-xs font-medium leading-5 text-[#374151]">
              I consent to the processing of my data under the Eswatini Data Protection Act 2022.
            </span>
          </label>
          {errors.consent && (
            <p className="mt-2 text-xs font-medium text-[#b91c1c]">{errors.consent.message}</p>
          )}
        </div>

        {serverError && (
          <div className="flex gap-2 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-medium text-[#b91c1c]">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#2d8bc4] px-4 text-sm font-bold text-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#256b9a] hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        <div className="rounded-md bg-[#f7fbff] px-3 py-3 text-center text-xs font-medium text-[#4b5563]">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#2d8bc4] hover:underline">
            Login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

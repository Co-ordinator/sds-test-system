import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import { GOV, MINISTRY_NAME } from '../theme/government';

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
      firstName: (data.firstName || '').trim(),
      lastName: (data.lastName || '').trim(),
      nationalId: data.nationalId.trim(),
      email: data.email.trim(),
      password: data.password,
      consent: Boolean(data.consent)
    };
    try {
      const response = await api.post('/api/v1/auth/register', payload);
      const verificationEmailSent = response?.data?.verificationEmailSent !== false;
      const verifiedEmail = response?.data?.data?.email || payload.email;
      const resendAvailableInSeconds = response?.data?.resendAvailableInSeconds ?? response?.data?.data?.resendAvailableInSeconds ?? 120;
      try { sessionStorage.setItem('pendingVerificationEmail', verifiedEmail); } catch (_) {}
      navigate('/verify-otp', {
        state: {
          email: verifiedEmail,
          verificationEmailSent,
          resendAvailableInSeconds,
          message: response?.data?.message || ''
        }
      });
    } catch (err) {
      const uiMessage = err?.uiMessage || err?.response?.data?.message || 'Registration was unsuccessful. Please try again.';
      const details = Array.isArray(err?.details) ? err.details : [];

      let hasFieldError = false;
      for (const detail of details) {
        const field = detail?.field;
        const message = detail?.message;
        if (!field || !message) continue;
        if (!['firstName', 'lastName', 'nationalId', 'email', 'password', 'consent'].includes(field)) continue;
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
    <OnboardingLayout wide>
      {/* Outer card — centered, white, rounded, with shadow */}
      <div
        className="mx-auto flex w-full min-w-0 max-w-[430px] flex-col overflow-hidden rounded-2xl border bg-white shadow-[0_18px_45px_rgba(15,45,75,0.12)] lg:max-w-[860px] lg:min-h-[560px] lg:flex-row lg:rounded-none lg:border-0 lg:shadow-none"
        style={{ borderColor: GOV.border }}
      >
        {/* Left — illustration panel */}
        <div
          className="relative flex h-32 shrink-0 items-center justify-center overflow-hidden bg-[#f6f9fc] px-4 sm:h-40 lg:h-auto lg:grow-0 lg:shrink-0 lg:basis-[42%] lg:bg-white lg:p-8"
        >
          <img
            src="/login_cover.png"
            alt=""
            className="relative z-10 h-[190px] w-auto max-w-none object-contain sm:h-[230px] lg:h-auto lg:w-full lg:max-w-[500px]"
            style={{ maxWidth: '500px' }}
          />
        </div>

        {/* Right — form panel */}
        <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-5 sm:px-7 lg:px-10 lg:py-8">
          {/* Heading block */}
          <div style={{ marginBottom: '0.95rem' }}>
            <h1
              className="text-[1.7rem] font-extrabold leading-tight sm:text-[1.85rem] lg:text-[2rem]"
              style={{
                lineHeight: 1.15,
                color: GOV.text,
                margin: 0,
              }}
            >
              Register
            </h1>
            <p
              style={{
                fontSize: '0.85rem',
                fontWeight: 400,
                color: GOV.textMuted,
                margin: '0.15rem 0 0.5rem',
                lineHeight: 1.35,
              }}
            >
              Register to access the secure assessment workspace administered by the {MINISTRY_NAME}.
            </p>
            <p
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: GOV.text,
                margin: 0,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Required information
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '0.72rem' }}>

            {/* Given name + surname — two columns. Captured at registration so
                the onboarding wizard can focus on programme/work details. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div style={styles.inputWrapper(!!errors.firstName)}>
                  <span style={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    {...register('firstName', {
                      required: 'Given name is required.',
                      maxLength: { value: 255, message: 'Given name is too long.' }
                    })}
                    type="text"
                    autoComplete="given-name"
                    placeholder="Given name"
                    style={styles.input}
                  />
                </div>
                {errors.firstName && <p style={styles.errorText}>{errors.firstName.message}</p>}
              </div>
              <div>
                <div style={styles.inputWrapper(!!errors.lastName)}>
                  <span style={styles.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    {...register('lastName', {
                      required: 'Surname is required.',
                      maxLength: { value: 255, message: 'Surname is too long.' }
                    })}
                    type="text"
                    autoComplete="family-name"
                    placeholder="Surname"
                    style={styles.input}
                  />
                </div>
                {errors.lastName && <p style={styles.errorText}>{errors.lastName.message}</p>}
              </div>
            </div>

            {/* National ID — required for SDS registration */}
            <div>
              <div style={styles.inputWrapper(!!errors.nationalId)}>
                <span style={styles.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 6h6M9 10h6M9 14h4"/></svg>
                </span>
                <input
                  {...register('nationalId', {
                    required: 'National ID is required.',
                    pattern: { value: /^\d{13}$/, message: 'National ID must be exactly 13 digits.' }
                  })}
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="National ID (13 digits)"
                  style={styles.input}
                />
              </div>
              {errors.nationalId && <p style={styles.errorText}>{errors.nationalId.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <div style={styles.inputWrapper(!!errors.email)}>
                <span style={styles.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  {...register('email', {
                    required: 'Email address is required.',
                    pattern: { value: EMAIL_REGEX, message: 'Please enter a valid email address.' }
                  })}
                  type="email"
                  autoComplete="username"
                  placeholder="Email address"
                  style={styles.input}
                />
              </div>
              {errors.email && <p style={styles.errorText}>{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div style={styles.inputWrapper(!!errors.password)}>
                <span style={styles.inputIcon}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  {...register('password', {
                    required: 'Password is required.',
                    minLength: { value: 12, message: 'Password must be at least 12 characters.' },
                    pattern: { value: /^(?=.*[A-Za-z])(?=.*\d).{12,}$/, message: 'Password must be at least 12 characters and contain both letters and numbers. Symbols are allowed.' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Password (at least 12 characters)"
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errors.password && <p style={styles.errorText}>{errors.password.message}</p>}
            </div>

            {/* Consent */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                id="reg-consent"
                type="checkbox"
                {...register('consent', { required: 'You must accept the terms to register.' })}
                style={{ marginTop: '2px', accentColor: GOV.blue, flexShrink: 0 }}
              />
              <label htmlFor="reg-consent" style={{ fontSize: '0.7rem', color: GOV.textMuted, lineHeight: 1.4 }}>
                I consent to the processing of my personal data in accordance with the Eswatini Data Protection Act, 2022.
              </label>
            </div>
            {errors.consent && <p style={styles.errorText}>{errors.consent.message}</p>}

            {serverError && (
              <div style={{ background: GOV.errorBg, border: `1px solid ${GOV.errorBorder}`, borderRadius: '6px', padding: '8px 12px', fontSize: '0.75rem', color: GOV.error }}>
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:hover:opacity-100"
              style={{
                width: '100%',
                padding: '0.82rem',
                background: GOV.blue,
                color: GOV.ministryBarText,
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                marginTop: '0.25rem',
                letterSpacing: '0.02em',
                outlineColor: GOV.blue,
              }}
            >
              {isSubmitting ? 'Creating your account…' : 'Create account'}
            </button>

            {/* Already have account */}
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: GOV.textMuted, margin: '0.35rem 0 0' }}>
              Already registered?{' '}
              <Link to="/login" style={{ color: GOV.blue, fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>

          </form>
        </div>
      </div>
    </OnboardingLayout>
  );
}

const styles = {
  inputWrapper: (hasError) => ({
    display: 'flex',
    alignItems: 'center',
    background: '#f8fafc',
    border: `1px solid ${hasError ? GOV.error : GOV.border}`,
    borderRadius: '10px',
    padding: '0 12px',
    height: '43px',
  }),
  inputIcon: {
    display: 'flex',
    alignItems: 'center',
    color: GOV.textHint,
    marginRight: '8px',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '0.82rem',
    color: GOV.text,
    outline: 'none',
    height: '100%',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: GOV.textHint,
    display: 'flex',
    alignItems: 'center',
    padding: '0 0 0 6px',
  },
  errorText: {
    fontSize: '0.7rem',
    color: GOV.error,
    margin: '3px 0 0',
  },
};
